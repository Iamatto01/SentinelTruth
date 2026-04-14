// HuggingFace Fallback — OpenAI-compatible Inference Providers endpoint
// Free tier depends on account/token permissions and provider availability.

const HF_API_BASE = 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_HF_MODELS = [
  'Qwen/Qwen2.5-72B-Instruct',
  'Qwen/Qwen2.5-32B-Instruct',
  'meta-llama/Llama-3.1-8B-Instruct',
];

function withDefaultPolicy(modelId) {
  const value = String(modelId || '').trim();
  if (!value) return '';
  // Keep explicit provider or pricing policy if already supplied.
  return value.includes(':') ? value : `${value}:fastest`;
}

class HuggingFaceFallback {
  constructor() {
    this.token = process.env.HF_API_TOKEN || process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY || '';
    const configuredModels = (process.env.HUGGING_FACE_MODELS || process.env.HF_MODELS || '')
      .split(',')
      .map((m) => withDefaultPolicy(m))
      .filter(Boolean);

    this.models = configuredModels.length > 0
      ? configuredModels
      : DEFAULT_HF_MODELS.map((m) => withDefaultPolicy(m));

    this.model = this.models[0] || withDefaultPolicy('meta-llama/Llama-3.1-8B-Instruct');
    this.callCount = 0;
    this.lastReset = Date.now();
    this.lastError = null;
    this.blockedUntil = 0;
  }

  isAvailable() {
    return !!this.token;
  }

  _checkRateLimit() {
    if (Date.now() - this.lastReset > 3600000) {
      this.callCount = 0;
      this.lastReset = Date.now();
    }
    return this.callCount < 50;
  }

  async analyzeTopic(topic) {
    if (!this.isAvailable()) {
      return { success: false, error: 'No HF token' };
    }

    if (Date.now() < this.blockedUntil) {
      return { success: false, error: this.lastError || 'HF temporarily unavailable' };
    }
    const systemPrompt = 'You are a Malaysian political fact-checker. Return strict JSON only.';
    const userPrompt = `Analyze this claim and return a JSON object.

Claim: ${topic.title}
Context: ${topic.snippet || ''}
Party: ${topic.party || 'Unknown'}

Return JSON with: verdict (TRUE/HOAX/MISLEADING/PARTIALLY_TRUE/UNVERIFIED), summary, analysis, party, category, impact (high/medium/low), region, confidence (high/medium/low).

Return ONLY valid JSON, nothing else.`;

    let lastError = 'HF inference failed';

    for (const model of this.models) {
      if (!this._checkRateLimit()) {
        return { success: false, error: 'Rate limited' };
      }

      try {
        this.callCount++;
        const response = await fetch(HF_API_BASE, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 900,
            stream: false,
          })
        });

        if (!response.ok) {
          const err = await response.text();
          lastError = `HF API ${response.status}`;

          if (response.status === 404 || response.status === 400) {
            console.warn(`[HF] Model unavailable on router (${model})`);
            continue;
          }

          if (response.status === 402) {
            this.lastError = 'HF credits depleted (402)';
            this.blockedUntil = Date.now() + 3600000;
            console.error('[HF] API error:', response.status, err);
            return { success: false, error: this.lastError };
          }

          if (response.status === 429) {
            this.lastError = 'HF rate limited (429)';
            this.blockedUntil = Date.now() + 60000;
            console.error('[HF] API error:', response.status, err);
            return { success: false, error: this.lastError };
          }

          this.lastError = lastError;
          console.error('[HF] API error:', response.status, err);
          return { success: false, error: lastError };
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          lastError = 'Could not parse response';
          console.warn(`[HF] Non-JSON response from model ${model}`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        this.model = model;
        this.lastError = null;
        this.blockedUntil = 0;
        console.log(`[HF] Analyzed: "${topic.title}" → ${parsed.verdict} (${model})`);
        return { success: true, ...parsed };
      } catch (err) {
        lastError = err.message;
        this.lastError = err.message;
        console.error('[HF] Error:', err.message);
      }
    }

    this.lastError = lastError;
    return { success: false, error: lastError };
  }

  getUsage() {
    const blockedForSec = Math.max(0, Math.ceil((this.blockedUntil - Date.now()) / 1000));

    return {
      provider: 'HuggingFace',
      callsThisHour: this.callCount,
      maxPerHour: 50,
      available: this.isAvailable(),
      model: this.model,
      fallbackModels: this.models,
      blockedForSec,
      lastError: this.lastError,
    };
  }
}

export const huggingFaceFallback = new HuggingFaceFallback();

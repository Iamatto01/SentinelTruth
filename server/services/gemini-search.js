// Gemini Search — Uses Google Search Grounding to find real Malaysian political news
// Free: 5,000 grounded searches/month

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

class GeminiSearch {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = 'gemini-2.0-flash';
    this.callCount = 0;
    this.lastReset = Date.now();
    this.cooldownUntil = 0;
    this.lastError = null;
  }

  isAvailable() {
    return !!this.apiKey;
  }

  _checkRateLimit() {
    // Reset counter every hour
    if (Date.now() - this.lastReset > 3600000) {
      this.callCount = 0;
      this.lastReset = Date.now();
    }
    // Max 7 calls per hour to stay within 5000/month
    return this.callCount < 7;
  }

  _extractRetryAfterMs(errorText = '') {
    try {
      const parsed = JSON.parse(errorText);
      const retryInfo = parsed?.error?.details?.find(
        (detail) => detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
      );
      const retryDelay = retryInfo?.retryDelay;

      if (typeof retryDelay === 'string') {
        const seconds = parseFloat(retryDelay.replace(/[^0-9.]/g, ''));
        if (Number.isFinite(seconds) && seconds > 0) {
          return Math.max(1000, Math.ceil(seconds * 1000));
        }
      }
    } catch {
      // Ignore parse errors and fall back to regex/default.
    }

    const retryMatch = errorText.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
    if (retryMatch) {
      const seconds = parseFloat(retryMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.max(1000, Math.ceil(seconds * 1000));
      }
    }

    return 60000;
  }

  async searchPoliticalNews() {
    if (!this.isAvailable()) {
      console.log('[Gemini] No API key — skipping search');
      return { success: false, error: 'No API key', topics: [] };
    }

    const cooldownRemainingMs = this.cooldownUntil - Date.now();
    if (cooldownRemainingMs > 0) {
      const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
      console.log(`[Gemini] Cooldown active after quota error (${cooldownSeconds}s remaining)`);
      return {
        success: false,
        error: `Quota cooldown (${cooldownSeconds}s remaining)`,
        topics: [],
        quotaExceeded: true,
        retryAfterMs: cooldownRemainingMs,
      };
    }

    if (!this._checkRateLimit()) {
      console.log('[Gemini] Rate limited — skipping search');
      return { success: false, error: 'Rate limited', topics: [] };
    }

    const prompt = `Search for the latest Malaysian political news and controversies from the past week. Focus on claims, statements, or events involving these parties: PKR, DAP, AMANAH, UMNO, PAS, BERSATU (Parti Pribumi), GPS, MUDA.

Look for:
- Political claims that could be true or false
- Controversial statements by politicians
- Policy announcements with disputed facts
- Viral social media claims about politics
- Corruption allegations or investigations

Return EXACTLY a JSON array of 3-5 topics. Each topic must have:
{
  "title": "Clear, factual headline of the claim/event",
  "snippet": "2-3 sentence summary of what was claimed or reported",
  "party": "Primary party involved (one of: PKR, DAP, AMANAH, UMNO, PAS, BERSATU, GPS, MUDA)",
  "category": "One of: Economy, Corruption, Elections, Policy, Legislation, Coalition Politics, Racial Politics, Education, Foreign Relations, Digital Rights, Social Issues, Governance, Legal, Party Leadership, Disaster Management, Federalism, Digital Security",
  "sourceUrl": "URL of the news source if found",
  "sourceName": "Name of the news source"
}

Return ONLY the JSON array, no markdown formatting or code blocks.`;

    try {
      this.callCount++;
      const url = `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        this.lastError = `API ${response.status}`;

        if (response.status === 429) {
          const retryAfterMs = this._extractRetryAfterMs(err);
          this.cooldownUntil = Date.now() + retryAfterMs;
          console.error('[Gemini] API quota error:', response.status, err);
          return {
            success: false,
            error: `API ${response.status}`,
            topics: [],
            quotaExceeded: true,
            retryAfterMs,
          };
        }

        console.error('[Gemini] API error:', response.status, err);
        return { success: false, error: `API ${response.status}`, topics: [] };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract grounding sources
      const groundingMeta = data.candidates?.[0]?.groundingMetadata;
      const sources = groundingMeta?.groundingChunks?.map(c => ({
        name: c.web?.title || 'Source',
        url: c.web?.uri || ''
      })) || [];

      // Parse JSON from response
      let topics = [];
      try {
        // Try to extract JSON array from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          topics = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.error('[Gemini] JSON parse error:', parseErr.message);
        return { success: false, error: 'Parse error', topics: [] };
      }

      // Attach grounding sources to topics
      topics = topics.map((t, i) => ({
        ...t,
        sources: t.sourceUrl ? [{ name: t.sourceName || 'Source', url: t.sourceUrl }] : (sources[i] ? [sources[i]] : []),
      }));

      this.lastError = null;
      console.log(`[Gemini] Found ${topics.length} topics`);
      return { success: true, topics, groundingSources: sources };
    } catch (err) {
      this.lastError = err.message;
      console.error('[Gemini] Fetch error:', err.message);
      return { success: false, error: err.message, topics: [] };
    }
  }

  getUsage() {
    const cooldownRemainingSec = Math.max(0, Math.ceil((this.cooldownUntil - Date.now()) / 1000));

    return {
      provider: 'Gemini',
      callsThisHour: this.callCount,
      maxPerHour: 7,
      available: this.isAvailable(),
      cooldownRemainingSec,
      lastError: this.lastError,
    };
  }
}

export const geminiSearch = new GeminiSearch();

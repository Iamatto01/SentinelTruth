// Data Manager — JSON file storage for topics
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const TOPICS_FILE = join(DATA_DIR, 'topics.json');
const LOG_FILE = join(DATA_DIR, 'agent-log.json');

// Seed data import
import { SEED_TOPICS } from '../../src/data/seed-data.js';
import { PARTIES, VERDICTS } from '../../src/data/parties.js';

const MALAYSIA_SIGNAL_TERMS = [
  'malaysia',
  'malaysian',
  'pkr',
  'umno',
  'pas',
  'bersatu',
  'amanah',
  'gps',
  'muda',
  'anwar ibrahim',
  'zahid',
  'muhyiddin',
  'hadi awang',
  'rafizi',
  'putrajaya',
  'dewan rakyat',
  'dewan negara',
  'parlimen',
  'parliament malaysia',
  'kerajaan',
  'pakatan harapan',
  'perikatan nasional',
  'barisan nasional',
  'sprm',
  'macc',
  'pilihan raya',
  'suruhanjaya pilihan raya',
  'klang valley',
  'sabah',
  'sarawak',
];

const POLITICAL_SIGNAL_TERMS = [
  'politic',
  'political',
  'election',
  'policy',
  'parliament',
  'cabinet',
  'minister',
  'coalition',
  'opposition',
  'government',
  'governance',
  'corruption',
  'campaign',
  'bill',
  'legislation',
  'manifesto',
  'undi',
  'politik',
  'dasar',
  'budget',
  'macc',
  'sprm',
  'umno',
  'pas',
  'pkr',
  'bersatu',
  'amanah',
  'gps',
  'muda',
];

const MALAYSIAN_NEWS_DOMAINS = [
  'freemalaysiatoday.com',
  'malaymail.com',
  'bernama.com',
  'thestar.com.my',
  'bharian.com.my',
  'astroawani.com',
  'malaysiakini.com',
  'thesun.my',
  'sinardaily.my',
  'utusan.com.my',
  'nst.com.my',
  'facebook.com',
];

class DataManager {
  constructor() {
    this.strictRealMode = process.env.STRICT_REAL_MODE !== 'false';
    this.malaysiaPoliticsOnly = process.env.MALAYSIA_POLITICS_ONLY !== 'false';
    this.minimumVerificationScore = parseInt(process.env.VERIFICATION_MIN_SCORE || '65', 10);
    this._ensureDir();
    this._topics = this._load(TOPICS_FILE, SEED_TOPICS);
    this._log = this._load(LOG_FILE, []);
  }

  _ensureDir() {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  _load(file, fallback) {
    try {
      if (existsSync(file)) {
        const loaded = JSON.parse(readFileSync(file, 'utf-8'));
        if (file === TOPICS_FILE && Array.isArray(loaded)) {
          return loaded.map(topic => this._normalizeTopic(topic));
        }
        return loaded;
      }
    } catch { /* ignore */ }
    this._write(file, fallback);
    if (file === TOPICS_FILE && Array.isArray(fallback)) {
      return fallback.map(topic => this._normalizeTopic(topic));
    }
    return Array.isArray(fallback) ? [...fallback] : fallback;
  }

  _write(file, data) {
    try {
      writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('DataManager write error:', e.message);
    }
  }

  _save() {
    this._write(TOPICS_FILE, this._topics);
  }

  _saveLog() {
    if (this._log.length > 200) this._log = this._log.slice(-200);
    this._write(LOG_FILE, this._log);
  }

  _normalizeTopic(topic) {
    const normalized = { ...topic };
    const id = normalized.id || '';

    if (!normalized.recordType) {
      if (/^st-\d+$/i.test(id)) normalized.recordType = 'seed';
      else if (/^st-ai-/i.test(id)) normalized.recordType = 'ai';
      else normalized.recordType = 'collected';
    }

    if (!normalized.sourceType) {
      if (normalized.recordType === 'seed') normalized.sourceType = 'seed';
      else if (normalized.recordType === 'simulated') normalized.sourceType = 'simulated';
      else normalized.sourceType = 'internet';
    }

    if (normalized.recordType === 'seed' || normalized.recordType === 'simulated') {
      normalized.synthetic = true;
    }

    if (!Array.isArray(normalized.sources)) {
      normalized.sources = [];
    }

    return normalized;
  }

  _topicHasSourceUrl(topic) {
    return Array.isArray(topic.sources) && topic.sources.some(src => typeof src?.url === 'string' && /^https?:\/\//i.test(src.url));
  }

  _includesAnySignal(text, terms) {
    return terms.some((term) => {
      const normalized = String(term || '').toLowerCase();
      if (!normalized) return false;

      if (/^[a-z0-9]+$/.test(normalized) && normalized.length <= 4) {
        const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
      }

      return text.includes(normalized);
    });
  }

  _extractSourceHost(topic) {
    if (!Array.isArray(topic?.sources)) return '';
    const sourceUrl = topic.sources.find(src => typeof src?.url === 'string' && /^https?:\/\//i.test(src.url))?.url || '';
    try {
      return new URL(sourceUrl).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  _isMalaysianDomain(domain = '') {
    const normalized = String(domain || '').toLowerCase();
    if (!normalized) return false;
    if (normalized.endsWith('.my')) return true;
    return MALAYSIAN_NEWS_DOMAINS.some(known => normalized === known || normalized.endsWith(`.${known}`));
  }

  _isMalaysiaPoliticalTopic(topic) {
    if (!topic) return false;

    const titleText = `${topic.title || ''}`.toLowerCase();
    const hasMalaysiaSignal = this._includesAnySignal(titleText, MALAYSIA_SIGNAL_TERMS);
    const hasPoliticalSignal = this._includesAnySignal(titleText, POLITICAL_SIGNAL_TERMS);

    return hasMalaysiaSignal && hasPoliticalSignal;
  }

  _getPrimarySourceUrl(topic) {
    if (!Array.isArray(topic.sources)) return '';
    const source = topic.sources.find(src => typeof src?.url === 'string' && /^https?:\/\//i.test(src.url));
    return source?.url || '';
  }

  _isSyntheticTopic(topic) {
    if (!topic) return true;
    if (topic.synthetic === true) return true;
    if (topic.recordType === 'seed' || topic.recordType === 'simulated') return true;
    if (!topic.sourceType && /^st-\d+$/i.test(topic.id || '')) return true;
    if (topic.aiProvider === 'Heuristic' && !this._topicHasSourceUrl(topic)) return true;
    return false;
  }

  _isRealRecord(topic) {
    return topic?.recordType === 'collected' || topic?.sourceType === 'internet' || topic?.sourceType === 'facebook';
  }

  _isEligibleForStats(topic) {
    if (!this.strictRealMode) return true;
    if (this._isSyntheticTopic(topic)) return false;
    if (this.malaysiaPoliticsOnly && !this._isMalaysiaPoliticalTopic(topic)) return false;
    if (!this._isRealRecord(topic)) return false;
    if (!this._topicHasSourceUrl(topic)) return false;
    const score = Number(topic?.verification?.score || 0);
    return score >= this.minimumVerificationScore;
  }

  _applyVisibilityFilter(topics) {
    let filtered = [...topics];

    if (this.strictRealMode) {
      filtered = filtered.filter(topic => !this._isSyntheticTopic(topic) && this._topicHasSourceUrl(topic));
    }

    if (this.malaysiaPoliticsOnly) {
      filtered = filtered.filter(topic => this._isMalaysiaPoliticalTopic(topic));
    }

    return filtered;
  }

  _isDuplicateTopic(topic) {
    const incomingUrl = this._getPrimarySourceUrl(topic).toLowerCase();
    const incomingTitle = (topic.title || '').toLowerCase();

    return this._topics.some(existing => {
      const existingUrl = this._getPrimarySourceUrl(existing).toLowerCase();
      if (incomingUrl && existingUrl && incomingUrl === existingUrl) return true;

      const sim = this._similarity((existing.title || '').toLowerCase(), incomingTitle);
      return sim > 0.8;
    });
  }

  // --- Topics CRUD ---

  getAllTopics() {
    return this._applyVisibilityFilter(this._topics);
  }

  getTopicById(id) {
    const topic = this._topics.find(t => t.id === id) || null;
    if (!topic) return null;
    if (this.strictRealMode && this._isSyntheticTopic(topic)) return null;
    if (this.malaysiaPoliticsOnly && !this._isMalaysiaPoliticalTopic(topic)) return null;
    return topic;
  }

  addTopic(topic) {
    const normalized = this._normalizeTopic(topic);
    if (this._isDuplicateTopic(normalized)) return null;

    this._topics.unshift(normalized);
    this._save();
    return normalized;
  }

  addTopicsBulk(topics = []) {
    let added = 0;
    let duplicates = 0;

    for (const topic of topics) {
      const inserted = this.addTopic(topic);
      if (inserted) added++;
      else duplicates++;
    }

    return { added, duplicates, attempted: topics.length };
  }

  filterTopics({ party, verdict, category, search, limit = 100 } = {}) {
    let results = this._applyVisibilityFilter(this._topics);
    if (party && party !== 'ALL') results = results.filter(t => t.party === party);
    if (verdict && verdict !== 'ALL') results = results.filter(t => t.verdict === verdict);
    if (category && category !== 'ALL') results = results.filter(t => t.category === category);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return results.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
  }

  // --- Statistics ---

  getStats() {
    const visibleTopics = this._applyVisibilityFilter(this._topics);
    const topics = this.strictRealMode
      ? visibleTopics.filter(topic => this._isEligibleForStats(topic))
      : visibleTopics;
    const total = topics.length;

    const verdictCounts = {};
    Object.keys(VERDICTS).forEach(v => { verdictCounts[v] = 0; });
    topics.forEach(t => { verdictCounts[t.verdict] = (verdictCounts[t.verdict] || 0) + 1; });

    const partyStats = {};
    Object.keys(PARTIES).forEach(p => {
      const pt = topics.filter(t => t.party === p);
      const count = pt.length;
      const hoaxes = pt.filter(t => t.verdict === 'HOAX').length;
      const misleading = pt.filter(t => t.verdict === 'MISLEADING').length;
      const trueCount = pt.filter(t => t.verdict === 'TRUE').length;
      const partial = pt.filter(t => t.verdict === 'PARTIALLY_TRUE').length;
      const unverified = pt.filter(t => t.verdict === 'UNVERIFIED').length;
      const problemScore = count > 0 ? Math.round(((hoaxes + misleading) / count) * 100) : 0;
      const credibilityScore = count > 0 ? Math.round(((trueCount + partial * 0.5) / count) * 100) : 0;
      partyStats[p] = { id: p, total: count, true: trueCount, hoax: hoaxes, misleading, partiallyTrue: partial, unverified, problemScore, credibilityScore, percentage: total > 0 ? Math.round((count / total) * 100) : 0 };
    });

    const categoryCounts = {};
    topics.forEach(t => { categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1; });

    const monthlyTrend = {};
    topics.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyTrend[month]) monthlyTrend[month] = { total: 0, hoax: 0, true: 0, misleading: 0 };
      monthlyTrend[month].total++;
      if (t.verdict === 'HOAX') monthlyTrend[month].hoax++;
      if (t.verdict === 'TRUE') monthlyTrend[month].true++;
      if (t.verdict === 'MISLEADING') monthlyTrend[month].misleading++;
    });

    return {
      total, verdictCounts, partyStats, categoryCounts, monthlyTrend,
      hoaxRate: total > 0 ? Math.round((verdictCounts.HOAX / total) * 100) : 0,
      truthRate: total > 0 ? Math.round((verdictCounts.TRUE / total) * 100) : 0,
      dataQuality: this.getDataQualityStats(),
    };
  }

  getDataQualityStats() {
    const stored = this._topics;
    const visible = this._applyVisibilityFilter(stored);
    const counted = this.strictRealMode
      ? visible.filter(topic => this._isEligibleForStats(topic))
      : visible;

    const sourceTypeCounts = {};
    const verificationBuckets = { VERIFIED: 0, LIKELY_REAL: 0, WEAK: 0, REJECTED: 0, UNKNOWN: 0 };

    for (const topic of visible) {
      const sourceType = topic.sourceType || 'unknown';
      sourceTypeCounts[sourceType] = (sourceTypeCounts[sourceType] || 0) + 1;

      const status = topic.verification?.status || 'UNKNOWN';
      verificationBuckets[status] = (verificationBuckets[status] || 0) + 1;
    }

    const withSourceUrl = visible.filter(topic => this._topicHasSourceUrl(topic)).length;
    const syntheticExcluded = stored.filter(topic => this._isSyntheticTopic(topic)).length;

    return {
      strictRealMode: this.strictRealMode,
      malaysiaPoliticsOnly: this.malaysiaPoliticsOnly,
      minimumVerificationScore: this.minimumVerificationScore,
      totalStored: stored.length,
      visibleTopics: visible.length,
      countedForStats: counted.length,
      excludedFromStats: stored.length - counted.length,
      syntheticExcluded,
      withSourceUrl,
      sourceTypeCounts,
      verificationBuckets,
      acceptanceRate: visible.length > 0 ? Math.round((counted.length / visible.length) * 100) : 0,
    };
  }

  // --- Agent Log ---

  addLog(entry) {
    this._log.push({ ...entry, timestamp: new Date().toISOString() });
    this._saveLog();
  }

  getLog(limit = 50) {
    return this._log.slice(-limit);
  }

  clearLog() {
    this._log = [];
    this._saveLog();
  }

  // --- Reset ---

  reset() {
    this._topics = SEED_TOPICS.map(topic => this._normalizeTopic({
      ...topic,
      recordType: 'seed',
      sourceType: 'seed',
      synthetic: true,
      verification: {
        status: 'UNKNOWN',
        score: 0,
        method: 'seed_data',
        verifiedAt: null,
      },
    }));
    this._save();
    this._log = [];
    this._saveLog();
  }

  // Simple string similarity (Dice coefficient)
  _similarity(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const bigrams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
      const bigram = a.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    let intersect = 0;
    for (let i = 0; i < b.length - 1; i++) {
      const bigram = b.substring(i, i + 2);
      const count = bigrams.get(bigram) || 0;
      if (count > 0) { bigrams.set(bigram, count - 1); intersect++; }
    }
    return (2.0 * intersect) / (a.length + b.length - 2);
  }
}

export const dataManager = new DataManager();

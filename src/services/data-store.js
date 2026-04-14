// Data Store — localStorage persistence + query layer
import { SEED_TOPICS } from '../data/seed-data.js';
import { PARTIES, VERDICTS } from '../data/parties.js';

const STORAGE_KEY = 'sentineltruth_topics';
const AGENT_LOG_KEY = 'sentineltruth_agent_log';

class DataStore {
  constructor() {
    this._topics = [];
    this._agentLog = [];
    this._listeners = new Set();
    this._init();
  }

  _init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this._topics = JSON.parse(stored);
      } catch {
        this._topics = [...SEED_TOPICS];
        this._save();
      }
    } else {
      this._topics = [...SEED_TOPICS];
      this._save();
    }

    const logStored = localStorage.getItem(AGENT_LOG_KEY);
    if (logStored) {
      try {
        this._agentLog = JSON.parse(logStored);
      } catch {
        this._agentLog = [];
      }
    }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._topics));
  }

  _saveLog() {
    // Keep last 100 entries
    if (this._agentLog.length > 100) {
      this._agentLog = this._agentLog.slice(-100);
    }
    localStorage.setItem(AGENT_LOG_KEY, JSON.stringify(this._agentLog));
  }

  _notify() {
    this._listeners.forEach(fn => fn(this._topics));
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  // --- CRUD ---
  getAllTopics() {
    return [...this._topics];
  }

  getTopicById(id) {
    return this._topics.find(t => t.id === id) || null;
  }

  addTopic(topic) {
    this._topics.unshift(topic);
    this._save();
    this._notify();
    return topic;
  }

  updateTopic(id, updates) {
    const idx = this._topics.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this._topics[idx] = { ...this._topics[idx], ...updates };
    this._save();
    this._notify();
    return this._topics[idx];
  }

  // --- Filtering ---
  filterTopics({ party, verdict, category, search, dateFrom, dateTo } = {}) {
    let results = [...this._topics];

    if (party && party !== 'ALL') {
      results = results.filter(t => t.party === party);
    }
    if (verdict && verdict !== 'ALL') {
      results = results.filter(t => t.verdict === verdict);
    }
    if (category && category !== 'ALL') {
      results = results.filter(t => t.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      results = results.filter(t => t.date >= dateFrom);
    }
    if (dateTo) {
      results = results.filter(t => t.date <= dateTo);
    }

    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // --- Statistics ---
  getStats() {
    const topics = this._topics;
    const total = topics.length;

    // Verdict distribution
    const verdictCounts = {};
    Object.keys(VERDICTS).forEach(v => { verdictCounts[v] = 0; });
    topics.forEach(t => { verdictCounts[t.verdict] = (verdictCounts[t.verdict] || 0) + 1; });

    // Party stats
    const partyStats = {};
    Object.keys(PARTIES).forEach(p => {
      const partyTopics = topics.filter(t => t.party === p);
      const count = partyTopics.length;
      const hoaxes = partyTopics.filter(t => t.verdict === 'HOAX').length;
      const misleading = partyTopics.filter(t => t.verdict === 'MISLEADING').length;
      const trueCount = partyTopics.filter(t => t.verdict === 'TRUE').length;
      const partial = partyTopics.filter(t => t.verdict === 'PARTIALLY_TRUE').length;
      const unverified = partyTopics.filter(t => t.verdict === 'UNVERIFIED').length;

      const problemScore = count > 0 ? Math.round(((hoaxes + misleading) / count) * 100) : 0;
      const credibilityScore = count > 0 ? Math.round(((trueCount + partial * 0.5) / count) * 100) : 0;

      partyStats[p] = {
        id: p,
        total: count,
        true: trueCount,
        hoax: hoaxes,
        misleading,
        partiallyTrue: partial,
        unverified,
        problemScore,
        credibilityScore,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    });

    // Category distribution
    const categoryCounts = {};
    topics.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    // Monthly trend
    const monthlyTrend = {};
    topics.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyTrend[month]) {
        monthlyTrend[month] = { total: 0, hoax: 0, true: 0, misleading: 0 };
      }
      monthlyTrend[month].total++;
      if (t.verdict === 'HOAX') monthlyTrend[month].hoax++;
      if (t.verdict === 'TRUE') monthlyTrend[month].true++;
      if (t.verdict === 'MISLEADING') monthlyTrend[month].misleading++;
    });

    // Impact distribution
    const impactCounts = { high: 0, medium: 0, low: 0 };
    topics.forEach(t => { impactCounts[t.impact] = (impactCounts[t.impact] || 0) + 1; });

    return {
      total,
      verdictCounts,
      partyStats,
      categoryCounts,
      monthlyTrend,
      impactCounts,
      hoaxRate: total > 0 ? Math.round((verdictCounts.HOAX / total) * 100) : 0,
      truthRate: total > 0 ? Math.round((verdictCounts.TRUE / total) * 100) : 0,
    };
  }

  // --- Agent Log ---
  addAgentLog(entry) {
    this._agentLog.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    this._saveLog();
  }

  getAgentLog() {
    return [...this._agentLog];
  }

  clearAgentLog() {
    this._agentLog = [];
    this._saveLog();
  }

  // --- Reset ---
  resetToSeed() {
    this._topics = [...SEED_TOPICS];
    this._save();
    this._notify();
  }
}

// Singleton
export const dataStore = new DataStore();

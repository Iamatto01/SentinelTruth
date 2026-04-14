const TRUSTED_DOMAINS_HIGH = new Set([
  'bernama.com',
  'thestar.com.my',
  'freemalaysiatoday.com',
  'malaysiakini.com',
  'malaymail.com',
  'theedgemarkets.com',
  'nst.com.my',
  'reuters.com',
  'reutersagency.com',
  'bbc.co.uk',
  'bbc.com',
  'aljazeera.com',
  'theguardian.com',
  'nytimes.com',
  'channelnewsasia.com',
  'scmp.com',
  'bloomberg.com',
  'apnews.com',
  'worldbank.org',
  'dosm.gov.my',
  'mof.gov.my',
  'spr.gov.my',
  'bnm.gov.my',
  'jpa.gov.my',
  'moe.gov.my',
  'cybersecurity.my',
  'macc.gov.my',
  'nadma.gov.my',
  'sebenarnya.my',
  'jomcheck.org',
  'mycheck.my',
]);

const TRUSTED_DOMAINS_MEDIUM = new Set([
  'asianews.network',
  'sinchew.com.my',
  'utusan.com.my',
  'dapmalaysia.org',
  'anfrel.org',
  'facebook.com',
]);

const SUSPICIOUS_PATTERNS = [
  /free[-_]?gift/i,
  /guaranteed[-_]?profit/i,
  /click\s*here\s*now/i,
  /\bcasino\b/i,
  /\bbetting\b/i,
];

function normalizeTitle(title = '') {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function domainRoot(hostname = '') {
  return hostname.replace(/^www\./i, '').toLowerCase();
}

function extractDomain(url = '') {
  try {
    return domainRoot(new URL(url).hostname);
  } catch {
    return '';
  }
}

function buildTitleFingerprint(title = '') {
  const words = normalizeTitle(title)
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 10);
  return words.join(' ');
}

function clusterByFingerprint(records) {
  const clusters = new Map();

  for (const record of records) {
    const fingerprint = buildTitleFingerprint(record.title);
    if (!fingerprint) continue;
    if (!clusters.has(fingerprint)) clusters.set(fingerprint, []);
    clusters.get(fingerprint).push(record);
  }

  return clusters;
}

function trustedScoreForDomain(domain) {
  if (!domain) return 0;

  if (TRUSTED_DOMAINS_HIGH.has(domain)) return 30;
  if (TRUSTED_DOMAINS_MEDIUM.has(domain)) return 18;

  const highMatch = [...TRUSTED_DOMAINS_HIGH].some((trusted) => domain.endsWith(`.${trusted}`));
  if (highMatch) return 24;

  const medMatch = [...TRUSTED_DOMAINS_MEDIUM].some((trusted) => domain.endsWith(`.${trusted}`));
  if (medMatch) return 14;

  return 0;
}

function hasSuspiciousPattern(record) {
  const text = `${record.title || ''} ${record.summary || ''}`;
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
}

function scoreRecord(record, clusterMap) {
  const checks = {
    hasTitle: Boolean(record.title && record.title.length >= 15),
    hasSummary: Boolean(record.summary && record.summary.length >= 50),
    hasUrl: Boolean(record.url),
    hasDomain: Boolean(record.sourceDomain),
    hasPublishedAt: Boolean(record.publishedAt),
    sourceTrusted: false,
    multiSourceSupport: false,
    hasSuspiciousSignal: false,
    sourceType: record.sourceType,
    uniqueDomainsInCluster: 0,
  };

  let score = 0;
  const reasons = [];

  if (checks.hasTitle) score += 10;
  else reasons.push('Title too short or missing');

  if (checks.hasSummary) score += 10;
  else reasons.push('Summary missing or too short');

  if (checks.hasUrl) score += 12;
  else reasons.push('Missing source URL');

  if (checks.hasPublishedAt) score += 8;
  else reasons.push('Missing publish timestamp');

  const domain = domainRoot(record.sourceDomain || extractDomain(record.url));
  const trustScore = trustedScoreForDomain(domain);
  if (trustScore > 0) {
    checks.sourceTrusted = true;
    score += trustScore;
  } else if (domain) {
    score += 14;
    reasons.push(`Domain not in curated allowlist: ${domain}`);
  } else {
    reasons.push(`Untrusted domain: ${domain || 'unknown'}`);
  }

  if (record.sourceType === 'internet' && domain) {
    score += 8;
  }

  const fingerprint = buildTitleFingerprint(record.title);
  const cluster = fingerprint ? (clusterMap.get(fingerprint) || []) : [];
  const domains = new Set(cluster.map((entry) => domainRoot(entry.sourceDomain || extractDomain(entry.url))).filter(Boolean));
  checks.uniqueDomainsInCluster = domains.size;

  if (domains.size >= 2) {
    checks.multiSourceSupport = true;
    score += 18;
  } else if (domains.size === 1) {
    score += 6;
  } else {
    reasons.push('No corroborating sources for this claim title cluster');
  }

  if (record.sourceType === 'facebook') {
    const facebookPost = /facebook\.com\//i.test(record.url || '');
    if (facebookPost) {
      score += 8;
    } else {
      reasons.push('Facebook record missing permalink');
    }
  }

  const suspicious = hasSuspiciousPattern(record);
  if (suspicious) {
    checks.hasSuspiciousSignal = true;
    score -= 25;
    reasons.push('Suspicious language pattern detected');
  }

  if (!record.evidence || record.evidence.length === 0) {
    score -= 10;
    reasons.push('No evidence metadata present');
  }

  score = Math.max(0, Math.min(100, score));

  let status = 'REJECTED';
  if (score >= 80) status = 'VERIFIED';
  else if (score >= 65) status = 'LIKELY_REAL';
  else if (score >= 50) status = 'WEAK';

  return {
    ...record,
    sourceDomain: domain,
    verification: {
      status,
      score,
      checks,
      reasons,
      verifiedAt: new Date().toISOString(),
      method: 'rule_based_v1',
    },
  };
}

class SourceVerifier {
  constructor() {
    this.minimumAcceptedScore = parseInt(process.env.VERIFICATION_MIN_SCORE || '65', 10);
  }

  verifyBatch(records = []) {
    const clusterMap = clusterByFingerprint(records);
    const scored = records.map((record) => scoreRecord(record, clusterMap));

    const accepted = [];
    const rejected = [];

    for (const record of scored) {
      if (record.verification.score >= this.minimumAcceptedScore) {
        accepted.push(record);
      } else {
        rejected.push(record);
      }
    }

    const statusCounts = scored.reduce((acc, record) => {
      const key = record.verification.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      accepted,
      rejected,
      scored,
      metrics: {
        scanned: scored.length,
        accepted: accepted.length,
        rejected: rejected.length,
        acceptanceRate: scored.length > 0 ? Math.round((accepted.length / scored.length) * 100) : 0,
        minimumAcceptedScore: this.minimumAcceptedScore,
        statusCounts,
      },
    };
  }
}

export const sourceVerifier = new SourceVerifier();
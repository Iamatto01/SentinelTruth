// AI Agent — Simulates continuous fetching, analysis, and fact-checking
import { dataStore } from './data-store.js';
import { PARTIES } from '../data/parties.js';

const SIMULATED_NEW_TOPICS = [
  {
    title: 'Opposition claims EPF savings depleted under PH government',
    summary: 'Viral claims allege that Malaysians\' EPF savings have been significantly depleted due to government withdrawals during PH\'s tenure.',
    category: 'Economy',
    party: 'BERSATU',
    verdict: 'MISLEADING',
    analysis: 'EPF withdrawals were initiated across multiple administrations including during COVID-19 under PN. Current PH government has not introduced new EPF withdrawal schemes. The claim lacks temporal accuracy.',
    sources: [{ name: 'EPF Annual Report', url: 'https://www.kwsp.gov.my' }],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    title: 'DAP MP reveals RM500 million corruption scandal in defense ministry',
    summary: 'A DAP MP claims to have uncovered a RM500 million procurement fraud in the Defense Ministry.',
    category: 'Corruption',
    party: 'DAP',
    verdict: 'UNVERIFIED',
    analysis: 'The MP has presented documents in Parliament but formal investigation is pending. MACC has acknowledged receipt of the complaint. Verification requires completion of the official investigation.',
    sources: [{ name: 'Hansard Parliament', url: 'https://www.parlimen.gov.my' }],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Pending investigation'
  },
  {
    title: 'PAS distributes aid only to Muslim flood victims in Kelantan',
    summary: 'Allegations that PAS state government discriminated against non-Muslim flood victims in aid distribution.',
    category: 'Disaster Management',
    party: 'PAS',
    verdict: 'HOAX',
    analysis: 'State disaster records show aid was distributed to all affected residents regardless of religion. NGOs operating in the area confirmed equitable distribution. The claim was traced to a single unverified social media post.',
    sources: [{ name: 'NADMA', url: 'https://www.nadma.gov.my' }],
    impact: 'medium',
    region: 'Kelantan',
    factCheckRef: 'JomCheck'
  },
  {
    title: 'UMNO demands RM10 billion allocation for bumiputera entrepreneurs',
    summary: 'UMNO\'s economic bureau proposes a RM10 billion special allocation for bumiputera business development in Budget 2027.',
    category: 'Economy',
    party: 'UMNO',
    verdict: 'TRUE',
    analysis: 'UMNO\'s official policy paper submitted to the Finance Ministry includes this proposal. Whether it will be adopted remains to be seen. The figure represents UMNO\'s stated position.',
    sources: [{ name: 'UMNO Online', url: 'https://umno-online.my' }],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'Verified by party documents'
  },
  {
    title: 'PKR MP arrested for drunk driving in Putrajaya',
    summary: 'Social media posts claim a PKR member of Parliament was arrested for drunk driving in Putrajaya.',
    category: 'Misconduct',
    party: 'PKR',
    verdict: 'HOAX',
    analysis: 'PDRM Putrajaya confirmed no such arrest was made. The alleged photos circulated were from a different incident in Thailand. This is another case of fabricated defamatory content.',
    sources: [{ name: 'PDRM Statement', url: 'https://www.rmp.gov.my' }],
    impact: 'low',
    region: 'Putrajaya',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    title: 'GPS threatens to form independent Sarawak government if MA63 demands unmet',
    summary: 'Reports claim GPS has issued an ultimatum to the federal government regarding MA63 compliance.',
    category: 'Federalism',
    party: 'GPS',
    verdict: 'MISLEADING',
    analysis: 'GPS leadership expressed frustration over slow MA63 negotiations but did not issue a formal ultimatum. The party reiterated commitment to working within the current framework while pushing for faster resolution.',
    sources: [{ name: 'Borneo Post', url: 'https://www.theborneopost.com' }],
    impact: 'medium',
    region: 'Sarawak',
    factCheckRef: 'JomCheck'
  }
];

const AGENT_ACTIONS = [
  'Scanning Malaysian news sources...',
  'Analyzing claims from social media...',
  'Cross-referencing with Sebenarnya.my database...',
  'Checking JomCheck fact-checking archives...',
  'Running credibility analysis on sources...',
  'Evaluating political context and party positions...',
  'Identifying connections between topics...',
  'Computing party reliability scores...',
  'Updating statistical models...',
  'Scanning for new viral political claims...',
  'Verifying claims against official government records...',
  'Checking MCMC complaint database...',
  'Analyzing sentiment patterns in political discourse...',
  'Cross-referencing with Bernama news archive...',
  'Evaluating source bias indicators...',
];

class AIAgent {
  constructor() {
    this.status = 'idle'; // idle, running, paused
    this._interval = null;
    this._actionInterval = null;
    this._topicQueue = [...SIMULATED_NEW_TOPICS];
    this._currentAction = '';
    this._topicsAnalyzed = 0;
    this._listeners = new Set();
    this._actionListeners = new Set();
  }

  onStatusChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  onAction(fn) {
    this._actionListeners.add(fn);
    return () => this._actionListeners.delete(fn);
  }

  _notifyStatus() {
    this._listeners.forEach(fn => fn(this.status));
  }

  _notifyAction(action) {
    this._currentAction = action;
    this._actionListeners.forEach(fn => fn(action));
  }

  start() {
    if (this.status === 'running') return;
    this.status = 'running';
    this._notifyStatus();

    dataStore.addAgentLog({ type: 'system', message: 'AI Agent started — beginning continuous analysis' });
    this._notifyAction('Initializing analysis pipeline...');

    // Simulate periodic actions
    this._actionInterval = setInterval(() => {
      const action = AGENT_ACTIONS[Math.floor(Math.random() * AGENT_ACTIONS.length)];
      this._notifyAction(action);
      dataStore.addAgentLog({ type: 'action', message: action });
    }, 4000);

    // Simulate finding new topics periodically
    this._interval = setInterval(() => {
      this._processNextTopic();
    }, 15000);

    // Process first topic quickly
    setTimeout(() => this._processNextTopic(), 5000);
  }

  pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    clearInterval(this._interval);
    clearInterval(this._actionInterval);
    this._interval = null;
    this._actionInterval = null;
    this._notifyStatus();
    dataStore.addAgentLog({ type: 'system', message: 'AI Agent paused' });
    this._notifyAction('Agent paused');
  }

  stop() {
    this.status = 'idle';
    clearInterval(this._interval);
    clearInterval(this._actionInterval);
    this._interval = null;
    this._actionInterval = null;
    this._notifyStatus();
    dataStore.addAgentLog({ type: 'system', message: 'AI Agent stopped' });
    this._notifyAction('Agent idle');
  }

  getStatus() {
    return {
      status: this.status,
      currentAction: this._currentAction,
      topicsAnalyzed: this._topicsAnalyzed,
      queueLength: this._topicQueue.length
    };
  }

  _processNextTopic() {
    if (this._topicQueue.length === 0) {
      // Recycle queue with variations
      this._topicQueue = SIMULATED_NEW_TOPICS.map(t => ({
        ...t,
        title: t.title + ' [Update]',
        date: new Date().toISOString().split('T')[0]
      }));
    }

    const template = this._topicQueue.shift();
    const newTopic = {
      ...template,
      id: `st-auto-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      connections: []
    };

    dataStore.addTopic(newTopic);
    this._topicsAnalyzed++;

    const partyName = PARTIES[newTopic.party]?.name || newTopic.party;
    dataStore.addAgentLog({
      type: 'discovery',
      message: `New topic analyzed: "${newTopic.title}" — Verdict: ${newTopic.verdict} — Party: ${partyName}`
    });

    this._notifyAction(`Completed analysis: ${newTopic.title.substring(0, 50)}...`);
  }
}

// Singleton
export const aiAgent = new AIAgent();

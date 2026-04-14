export const PARTIES = {
  PKR: {
    id: 'PKR',
    name: 'Parti Keadilan Rakyat',
    abbr: 'PKR',
    coalition: 'PH',
    color: '#0288d1',
    colorLight: 'rgba(2, 136, 209, 0.15)',
    gradient: 'linear-gradient(135deg, #0288d1, #01579b)',
    leader: 'Anwar Ibrahim',
    founded: 1999,
    ideology: 'Reformism, Social democracy',
    description: 'Core party of Pakatan Harapan, leads the current Unity Government under PM Anwar Ibrahim.'
  },
  DAP: {
    id: 'DAP',
    name: 'Democratic Action Party',
    abbr: 'DAP',
    coalition: 'PH',
    color: '#d32f2f',
    colorLight: 'rgba(211, 47, 47, 0.15)',
    gradient: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    leader: 'Anthony Loke',
    founded: 1966,
    ideology: 'Social democracy, Multiracialism',
    description: 'Major PH component emphasizing institutional reforms and multiracial governance.'
  },
  AMANAH: {
    id: 'AMANAH',
    name: 'Parti Amanah Negara',
    abbr: 'AMANAH',
    coalition: 'PH',
    color: '#f57c00',
    colorLight: 'rgba(245, 124, 0, 0.15)',
    gradient: 'linear-gradient(135deg, #f57c00, #e65100)',
    leader: 'Mohamad Sabu',
    founded: 2015,
    ideology: 'Progressive Islam, Social democracy',
    description: 'PH\'s Islamic-progressive party, positioned as a moderate alternative to PAS.'
  },
  UMNO: {
    id: 'UMNO',
    name: 'United Malays National Organisation',
    abbr: 'UMNO',
    coalition: 'BN',
    color: '#c62828',
    colorLight: 'rgba(198, 40, 40, 0.15)',
    gradient: 'linear-gradient(135deg, #c62828, #8e0000)',
    leader: 'Ahmad Zahid Hamidi',
    founded: 1946,
    ideology: 'Malay nationalism, Conservatism',
    description: 'Historically dominant party, now part of the Unity Government under BN.'
  },
  PAS: {
    id: 'PAS',
    name: 'Parti Islam Se-Malaysia',
    abbr: 'PAS',
    coalition: 'PN',
    color: '#2e7d32',
    colorLight: 'rgba(46, 125, 50, 0.15)',
    gradient: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
    leader: 'Abdul Hadi Awang',
    founded: 1951,
    ideology: 'Islamism, Conservatism',
    description: 'Dominant force within PN opposition, pushing for Islamic governance.'
  },
  BERSATU: {
    id: 'BERSATU',
    name: 'Parti Pribumi Bersatu Malaysia',
    abbr: 'BERSATU',
    coalition: 'PN',
    color: '#1a237e',
    colorLight: 'rgba(26, 35, 126, 0.15)',
    gradient: 'linear-gradient(135deg, #1a237e, #0d1642)',
    leader: 'Hamzah Zainudin',
    founded: 2016,
    ideology: 'Malay nationalism, Bumiputera-first',
    description: 'Co-anchor of PN, currently navigating post-Muhyiddin leadership transition.'
  },
  GPS: {
    id: 'GPS',
    name: 'Gabungan Parti Sarawak',
    abbr: 'GPS',
    coalition: 'GPS',
    color: '#00897b',
    colorLight: 'rgba(0, 137, 123, 0.15)',
    gradient: 'linear-gradient(135deg, #00897b, #004d40)',
    leader: 'Abang Johari Openg',
    founded: 2018,
    ideology: 'Sarawak autonomy, Regionalism',
    description: 'Sarawak-based coalition supporting the Unity Government, advocates for Borneo state rights.'
  },
  MUDA: {
    id: 'MUDA',
    name: 'Malaysian United Democratic Alliance',
    abbr: 'MUDA',
    coalition: 'Independent',
    color: '#7c4dff',
    colorLight: 'rgba(124, 77, 255, 0.15)',
    gradient: 'linear-gradient(135deg, #7c4dff, #6200ea)',
    leader: 'Syed Saddiq',
    founded: 2020,
    ideology: 'Youth politics, Progressive',
    description: 'Youth-centric party advocating for generational change in Malaysian politics.'
  }
};

export const COALITIONS = {
  PH: {
    id: 'PH',
    name: 'Pakatan Harapan',
    parties: ['PKR', 'DAP', 'AMANAH'],
    color: '#1e88e5',
    status: 'Ruling',
    description: 'The Hope Coalition — leads the Unity Government'
  },
  BN: {
    id: 'BN',
    name: 'Barisan Nasional',
    parties: ['UMNO'],
    color: '#1565c0',
    status: 'Ruling (Partner)',
    description: 'National Front — coalition partner in Unity Government'
  },
  PN: {
    id: 'PN',
    name: 'Perikatan Nasional',
    parties: ['PAS', 'BERSATU'],
    color: '#2e7d32',
    status: 'Opposition',
    description: 'National Alliance — main opposition coalition'
  },
  GPS: {
    id: 'GPS',
    name: 'Gabungan Parti Sarawak',
    parties: ['GPS'],
    color: '#00897b',
    status: 'Ruling (Partner)',
    description: 'Sarawak coalition supporting the government'
  }
};

export const VERDICTS = {
  TRUE: { label: 'Verified True', icon: '✅', color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.12)' },
  HOAX: { label: 'Hoax', icon: '🚫', color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.12)' },
  MISLEADING: { label: 'Misleading', icon: '⚠️', color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.12)' },
  UNVERIFIED: { label: 'Unverified', icon: '❓', color: '#9e9e9e', bgColor: 'rgba(158, 158, 158, 0.12)' },
  PARTIALLY_TRUE: { label: 'Partially True', icon: '🔶', color: '#ffc107', bgColor: 'rgba(255, 193, 7, 0.12)' }
};

export function getPartyById(id) {
  return PARTIES[id] || null;
}

export function getCoalitionForParty(partyId) {
  const party = PARTIES[partyId];
  if (!party) return null;
  return COALITIONS[party.coalition] || null;
}

export function getPartiesByCoalition(coalitionId) {
  const coalition = COALITIONS[coalitionId];
  if (!coalition) return [];
  return coalition.parties.map(id => PARTIES[id]).filter(Boolean);
}

export function getAllPartyIds() {
  return Object.keys(PARTIES);
}

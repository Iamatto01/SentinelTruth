// SentinelTruth Seed Data — Real Malaysian political topics (2024-2026)
// Each topic is a real or realistic political claim/event for demonstration

export const SEED_TOPICS = [
  {
    id: 'st-001',
    title: 'PM Anwar announces RM100 billion economic stimulus package',
    summary: 'Claims circulated that PM Anwar Ibrahim announced a RM100 billion stimulus package for 2026. The actual figure approved in Budget 2026 was RM420.4 billion in total expenditure, with targeted subsidies rather than a blanket stimulus.',
    category: 'Economy',
    party: 'PKR',
    verdict: 'MISLEADING',
    date: '2025-10-15',
    sources: [
      { name: 'Bernama', url: 'https://www.bernama.com' },
      { name: 'The Star', url: 'https://www.thestar.com.my' }
    ],
    analysis: 'The claim conflates total budget allocation with a dedicated stimulus package. While economic support measures exist, labeling the entire expenditure as "stimulus" is inaccurate. Budget 2026 includes targeted subsidies, infrastructure projects, and social safety nets.',
    connections: ['st-003', 'st-012'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-002',
    title: 'PAS proposes nationwide Shariah law expansion',
    summary: 'Viral claims suggested PAS has tabled a bill to expand Shariah law jurisdiction across all states. In reality, PAS president Abdul Hadi Awang reiterated party stance but no formal bill was tabled in Parliament.',
    category: 'Legislation',
    party: 'PAS',
    verdict: 'HOAX',
    date: '2025-11-22',
    sources: [
      { name: 'Malaysiakini', url: 'https://www.malaysiakini.com' },
      { name: 'Free Malaysia Today', url: 'https://www.freemalaysiatoday.com' }
    ],
    analysis: 'While PAS has historically pushed for RUU355 amendments, no new bill was formally tabled. The claim appears to be recycled from previous parliamentary sessions and was amplified on social media without verification.',
    connections: ['st-008'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'JomCheck'
  },
  {
    id: 'st-003',
    title: 'Targeted subsidy rationalization saves RM8 billion',
    summary: 'Government claims that the diesel and electricity subsidy rationalization program saved RM8 billion in 2025, redirected to social welfare programs.',
    category: 'Economy',
    party: 'PKR',
    verdict: 'PARTIALLY_TRUE',
    date: '2025-12-10',
    sources: [
      { name: 'Ministry of Finance', url: 'https://www.mof.gov.my' },
      { name: 'The Edge Markets', url: 'https://www.theedgemarkets.com' }
    ],
    analysis: 'The savings figure is approximately correct based on MOF reports, but the full amount redirected to social welfare is debated. Independent economists estimate only 60% of savings went directly to social programs, with the remainder used for fiscal deficit reduction.',
    connections: ['st-001', 'st-015'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-004',
    title: 'UMNO threatens to exit Unity Government over DAP appointments',
    summary: 'Reports claimed UMNO supreme council voted to leave the Unity Government due to DAP receiving key GLC appointments. UMNO officially denied the reports.',
    category: 'Coalition Politics',
    party: 'UMNO',
    verdict: 'HOAX',
    date: '2025-09-05',
    sources: [
      { name: 'New Straits Times', url: 'https://www.nst.com.my' },
      { name: 'Utusan Malaysia', url: 'https://www.utusan.com.my' }
    ],
    analysis: 'The claim originated from anonymous social media accounts and was not substantiated by any official statement. UMNO president Zahid Hamidi confirmed the party\'s commitment to the Unity Government. Internal tensions exist but no formal exit vote occurred.',
    connections: ['st-007', 'st-010'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-005',
    title: 'DAP calls for abolition of Bumiputera quotas',
    summary: 'Claims spread on social media that DAP has officially called for the abolition of all Bumiputera quota systems. The party actually proposed reforms to make the system more transparent and needs-based.',
    category: 'Policy',
    party: 'DAP',
    verdict: 'MISLEADING',
    date: '2025-08-18',
    sources: [
      { name: 'Malaysiakini', url: 'https://www.malaysiakini.com' },
      { name: 'DAP Official Statement', url: 'https://dapmalaysia.org' }
    ],
    analysis: 'The viral claim distorts DAP\'s actual position. DAP proposed transitioning from race-based to needs-based affirmative action, not abolishing assistance for Bumiputera communities. The misleading framing was amplified by opposition-aligned media.',
    connections: ['st-004', 'st-009'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'JomCheck'
  },
  {
    id: 'st-006',
    title: 'Muhyiddin Yassin steps down as PN chairman',
    summary: 'Former PM Muhyiddin Yassin announces resignation as Perikatan Nasional chairman, triggering leadership contest between PAS and Bersatu.',
    category: 'Party Leadership',
    party: 'BERSATU',
    verdict: 'TRUE',
    date: '2025-12-28',
    sources: [
      { name: 'Channel News Asia', url: 'https://www.channelnewsasia.com' },
      { name: 'Bernama', url: 'https://www.bernama.com' }
    ],
    analysis: 'Confirmed through official PN communication and press conference. Muhyiddin cited health and personal reasons. This triggered significant internal restructuring within PN, with PAS emerging as the dominant coalition partner.',
    connections: ['st-002', 'st-013'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Verified by multiple sources'
  },
  {
    id: 'st-007',
    title: 'Zahid Hamidi granted full acquittal in corruption case',
    summary: 'Reports that Deputy PM Ahmad Zahid Hamidi was granted a full acquittal in his corruption trial. The case is actually ongoing with discharge not amounting to acquittal (DNAA) for some charges.',
    category: 'Legal',
    party: 'UMNO',
    verdict: 'MISLEADING',
    date: '2025-07-14',
    sources: [
      { name: 'The Star', url: 'https://www.thestar.com.my' },
      { name: 'Malay Mail', url: 'https://www.malaymail.com' }
    ],
    analysis: 'The legal situation is complex. While some charges received DNAA, it is not equivalent to a full acquittal. The prosecution retains the right to reinstate charges. Describing it as a "full acquittal" is legally inaccurate.',
    connections: ['st-004', 'st-010'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'MyCheck.my'
  },
  {
    id: 'st-008',
    title: 'PAS-governed states have highest poverty rates',
    summary: 'Viral infographic claims that PAS-governed states (Kelantan, Terengganu, Kedah) have the highest poverty rates in Malaysia.',
    category: 'Economy',
    party: 'PAS',
    verdict: 'PARTIALLY_TRUE',
    date: '2025-06-20',
    sources: [
      { name: 'Department of Statistics Malaysia', url: 'https://www.dosm.gov.my' },
      { name: 'World Bank Malaysia', url: 'https://www.worldbank.org/en/country/malaysia' }
    ],
    analysis: 'DOSM data confirms Kelantan and Terengganu have higher poverty incidence rates compared to national average. However, attributing this solely to PAS governance is misleading as these states have historically had fewer economic resources and geographic disadvantages. Federal allocation policies also play a significant role.',
    connections: ['st-002', 'st-003'],
    impact: 'medium',
    region: 'Kelantan, Terengganu, Kedah',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-009',
    title: 'Government bans Chinese education in national schools',
    summary: 'Social media posts claim the government plans to ban Chinese-language education in national schools. The Ministry of Education denied any such plan.',
    category: 'Education',
    party: 'DAP',
    verdict: 'HOAX',
    date: '2025-05-10',
    sources: [
      { name: 'Ministry of Education', url: 'https://www.moe.gov.my' },
      { name: 'Sin Chew Daily', url: 'https://www.sinchew.com.my' }
    ],
    analysis: 'Completely fabricated claim with no basis in government policy. The Education Ministry issued an official denial. Chinese vernacular schools (SJKC) continue to operate normally. The false claim appears designed to stoke racial tensions.',
    connections: ['st-005'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-010',
    title: 'MACC investigation into corporate "mafia" linked to ruling coalition',
    summary: 'Reports of MACC investigations into corporate entities with alleged links to ruling coalition politicians. Multiple arrests were made in early 2026.',
    category: 'Corruption',
    party: 'UMNO',
    verdict: 'TRUE',
    date: '2026-01-15',
    sources: [
      { name: 'Asian News Network', url: 'https://www.asianews.network' },
      { name: 'Malaysiakini', url: 'https://www.malaysiakini.com' }
    ],
    analysis: 'MACC confirmed investigations into corporate entities with political connections. Several arrests were made. The government characterized this as proof of institutional independence, while critics questioned selective enforcement.',
    connections: ['st-007', 'st-004'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Verified by MACC statements'
  },
  {
    id: 'st-011',
    title: 'Syed Saddiq proposes lowering voting age to 18',
    summary: 'MUDA founder Syed Saddiq claims the lowered voting age (Undi18) has been successfully implemented with 5.8 million new voters registered.',
    category: 'Elections',
    party: 'MUDA',
    verdict: 'TRUE',
    date: '2025-04-22',
    sources: [
      { name: 'Election Commission', url: 'https://www.spr.gov.my' },
      { name: 'Bernama', url: 'https://www.bernama.com' }
    ],
    analysis: 'Undi18 was indeed implemented following the constitutional amendment. The Election Commission confirmed automatic voter registration for citizens aged 18 and above. The exact number of new registrations is approximately correct.',
    connections: ['st-014'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-012',
    title: 'Ringgit collapse caused by government mismanagement',
    summary: 'Opposition claims the Ringgit\'s depreciation to 4.75 against USD is due to PH government economic mismanagement.',
    category: 'Economy',
    party: 'BERSATU',
    verdict: 'MISLEADING',
    date: '2025-11-05',
    sources: [
      { name: 'Bank Negara Malaysia', url: 'https://www.bnm.gov.my' },
      { name: 'Bloomberg', url: 'https://www.bloomberg.com' }
    ],
    analysis: 'The Ringgit\'s movement is influenced by global factors including US Federal Reserve interest rate policies, regional capital flows, and commodity prices. While domestic policy plays a role, attributing the currency\'s performance solely to government mismanagement oversimplifies complex macroeconomic dynamics.',
    connections: ['st-001', 'st-003'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'MyCheck.my'
  },
  {
    id: 'st-013',
    title: 'PAS wins three by-elections in a row',
    summary: 'Claims that PAS won three consecutive by-elections in 2025, showing declining government support.',
    category: 'Elections',
    party: 'PAS',
    verdict: 'PARTIALLY_TRUE',
    date: '2025-10-30',
    sources: [
      { name: 'Election Commission', url: 'https://www.spr.gov.my' },
      { name: 'Free Malaysia Today', url: 'https://www.freemalaysiatoday.com' }
    ],
    analysis: 'PAS won two by-elections and one was won by a PN-Bersatu candidate with PAS support. The claim of "three PAS wins" conflates PN coalition victories with PAS-only victories. Government support did see some decline in these areas, but national polling remained competitive.',
    connections: ['st-006', 'st-002'],
    impact: 'medium',
    region: 'Multiple states',
    factCheckRef: 'JomCheck'
  },
  {
    id: 'st-014',
    title: 'Sabah state election rigging allegations',
    summary: 'PN alleges widespread voter fraud and ballot stuffing during the November 2025 Sabah state elections.',
    category: 'Elections',
    party: 'BERSATU',
    verdict: 'HOAX',
    date: '2025-11-20',
    sources: [
      { name: 'Election Commission', url: 'https://www.spr.gov.my' },
      { name: 'International observers', url: 'https://www.anfrel.org' }
    ],
    analysis: 'The Election Commission and international observers from ANFREL confirmed the election was conducted fairly. No evidence of systematic fraud was found. Isolated procedural complaints were addressed through proper channels. The allegations appear politically motivated.',
    connections: ['st-011', 'st-013'],
    impact: 'high',
    region: 'Sabah',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-015',
    title: 'Government increases civil servant salaries by 15%',
    summary: 'Claims that the government approved a 15% salary increase for all civil servants effective 2026.',
    category: 'Policy',
    party: 'PKR',
    verdict: 'MISLEADING',
    date: '2026-01-08',
    sources: [
      { name: 'Public Service Department', url: 'https://www.jpa.gov.my' },
      { name: 'Bernama', url: 'https://www.bernama.com' }
    ],
    analysis: 'The Sistem Saraan Perkhidmatan Awam (SSPA) reform included adjustments averaging 7-15%, varying by grade and scheme. The blanket "15% increase" claim is misleading as it represents the maximum, not the average across all civil service grades.',
    connections: ['st-001', 'st-003'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'Verified by JPA statements'
  },
  {
    id: 'st-016',
    title: 'DAP member makes anti-Malay speech at party event',
    summary: 'Video circulated claiming to show a DAP member making inflammatory anti-Malay remarks at a party dinner. Investigation revealed the video was edited and taken out of context.',
    category: 'Racial Politics',
    party: 'DAP',
    verdict: 'HOAX',
    date: '2025-09-28',
    sources: [
      { name: 'Digital Forensics Analysis', url: 'https://factcheck.my' },
      { name: 'DAP Official Response', url: 'https://dapmalaysia.org' }
    ],
    analysis: 'Digital forensics confirmed the video was edited from multiple clips spliced together. The original speech discussed multiracial economic policies. MCMC investigated the source of the manipulated video.',
    connections: ['st-005', 'st-009'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-017',
    title: 'Kelantan floods: PAS government blamed for poor infrastructure',
    summary: 'Reports blamed the PAS state government for devastating floods in Kelantan due to poor infrastructure and drainage systems.',
    category: 'Disaster Management',
    party: 'PAS',
    verdict: 'PARTIALLY_TRUE',
    date: '2025-12-15',
    sources: [
      { name: 'NADMA', url: 'https://www.nadma.gov.my' },
      { name: 'The Star', url: 'https://www.thestar.com.my' }
    ],
    analysis: 'While infrastructure deficiencies contributed to flood impact, the annual monsoon floods are a recurring natural phenomenon. Both state and federal governments share responsibility for flood mitigation. Federal funding allocation and climate change are also significant factors.',
    connections: ['st-008'],
    impact: 'high',
    region: 'Kelantan',
    factCheckRef: 'MyCheck.my'
  },
  {
    id: 'st-018',
    title: 'Rafizi Ramli\'s PADU database breached exposing personal data',
    summary: 'Allegations that the PADU (Pangkalan Data Utama) central database was hacked, exposing millions of Malaysians\' personal information.',
    category: 'Digital Security',
    party: 'PKR',
    verdict: 'HOAX',
    date: '2025-08-03',
    sources: [
      { name: 'CyberSecurity Malaysia', url: 'https://www.cybersecurity.my' },
      { name: 'PADU Official', url: 'https://padu.gov.my' }
    ],
    analysis: 'CyberSecurity Malaysia conducted an investigation and found no evidence of a data breach. The alleged leaked data samples were traced to older scam databases unrelated to PADU. The government reinforced PADU\'s security measures as a precaution.',
    connections: ['st-015'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-019',
    title: 'GPS demands more federal allocation for Sarawak development',
    summary: 'GPS chief Abang Johari Openg states that Sarawak should receive 20% of federal revenue under the Malaysia Agreement 1963 (MA63).',
    category: 'Federalism',
    party: 'GPS',
    verdict: 'TRUE',
    date: '2026-02-10',
    sources: [
      { name: 'Borneo Post', url: 'https://www.theborneopost.com' },
      { name: 'New Straits Times', url: 'https://www.nst.com.my' }
    ],
    analysis: 'GPS has consistently advocated for Sarawak\'s rights under MA63. The demand for increased federal allocation is a legitimate political position based on the original Malaysia Agreement. Negotiations between state and federal governments continue.',
    connections: [],
    impact: 'medium',
    region: 'Sarawak',
    factCheckRef: 'Verified by official statements'
  },
  {
    id: 'st-020',
    title: 'Government secretly negotiating to sell national assets to China',
    summary: 'Viral WhatsApp messages claim the government is secretly negotiating to sell critical national assets including ports and land to Chinese companies.',
    category: 'Foreign Relations',
    party: 'PKR',
    verdict: 'HOAX',
    date: '2026-03-05',
    sources: [
      { name: 'Ministry of International Trade', url: 'https://www.miti.gov.my' },
      { name: 'Sebenarnya.my', url: 'https://sebenarnya.my' }
    ],
    analysis: 'No evidence of secret negotiations to sell national assets. Foreign investments in Malaysia follow established regulatory frameworks with parliamentary oversight. The claim appears to be a recurring disinformation narrative designed to undermine public trust in the government.',
    connections: ['st-001'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-021',
    title: 'Bersatu claims 20 UMNO MPs ready to defect to PN',
    summary: 'Bersatu leadership claims that 20 UMNO MPs are in discussions to join Perikatan Nasional, potentially destabilizing the Unity Government.',
    category: 'Coalition Politics',
    party: 'BERSATU',
    verdict: 'HOAX',
    date: '2026-02-20',
    sources: [
      { name: 'UMNO Online', url: 'https://umno-online.my' },
      { name: 'Malaysiakini', url: 'https://www.malaysiakini.com' }
    ],
    analysis: 'UMNO denied the claim categorically. No UMNO MP publicly confirmed negotiation with PN. This type of claim has been made repeatedly since 2022 without materializing. It appears to be a political tactic to project opposition strength.',
    connections: ['st-004', 'st-006'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'JomCheck'
  },
  {
    id: 'st-022',
    title: 'AMANAH proposes progressive Islamic finance reforms',
    summary: 'AMANAH president Mohamad Sabu announces party blueprint for modernizing Islamic finance regulations to attract more foreign investment.',
    category: 'Economy',
    party: 'AMANAH',
    verdict: 'TRUE',
    date: '2026-01-25',
    sources: [
      { name: 'AMANAH Official', url: 'https://amanah.org.my' },
      { name: 'The Edge Markets', url: 'https://www.theedgemarkets.com' }
    ],
    analysis: 'AMANAH did release a policy blueprint on Islamic finance modernization at their annual convention. The proposals include fintech integration, sustainable sukuk frameworks, and simplified Shariah compliance processes for SMEs.',
    connections: ['st-003'],
    impact: 'low',
    region: 'National',
    factCheckRef: 'Verified by party communications'
  },
  {
    id: 'st-023',
    title: 'PAS youth wing organizes anti-LGBTQ rally in KL',
    summary: 'Reports of PAS Youth organizing a large anti-LGBTQ rally in Kuala Lumpur with tens of thousands of attendees.',
    category: 'Social Issues',
    party: 'PAS',
    verdict: 'MISLEADING',
    date: '2025-07-30',
    sources: [
      { name: 'Astro Awani', url: 'https://www.astroawani.com' },
      { name: 'PDRM Statement', url: 'https://www.rmp.gov.my' }
    ],
    analysis: 'A gathering was organized but police estimated attendance at approximately 3,000-5,000, far below the "tens of thousands" claimed. The event was lawful but exaggerated in scale by both supporters and critics for political purposes.',
    connections: ['st-002'],
    impact: 'medium',
    region: 'Kuala Lumpur',
    factCheckRef: 'MyCheck.my'
  },
  {
    id: 'st-024',
    title: 'Cabinet reshuffle gives Bersatu members government positions',
    summary: 'Claims that PM Anwar\'s December 2025 cabinet reshuffle secretly included Bersatu members who defected to support the government.',
    category: 'Governance',
    party: 'BERSATU',
    verdict: 'PARTIALLY_TRUE',
    date: '2025-12-20',
    sources: [
      { name: 'PMO Statement', url: 'https://www.pmo.gov.my' },
      { name: 'New Straits Times', url: 'https://www.nst.com.my' }
    ],
    analysis: 'The reshuffle included former Bersatu members who left the party and became independent MPs supporting the government. They were not current Bersatu members. The distinction between "former Bersatu" and "Bersatu members" is significant.',
    connections: ['st-006', 'st-021'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'JomCheck'
  },
  {
    id: 'st-025',
    title: 'Malaysia drops 10 places in Transparency International corruption index',
    summary: 'Opposition claims Malaysia dropped 10 places in the 2025 Corruption Perceptions Index under PH governance.',
    category: 'Corruption',
    party: 'PAS',
    verdict: 'MISLEADING',
    date: '2026-01-30',
    sources: [
      { name: 'Transparency International', url: 'https://www.transparency.org' },
      { name: 'MACC', url: 'https://www.sprm.gov.my' }
    ],
    analysis: 'Malaysia\'s CPI ranking changed by 4 positions, not 10. The claim exaggerates the actual movement. Additionally, CPI methodology changes between years make direct comparisons complex. Anti-corruption efforts under the current government have received mixed independent assessments.',
    connections: ['st-010', 'st-007'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'MyCheck.my'
  },
  {
    id: 'st-026',
    title: 'PKR member caught with RM2 million cash in car',
    summary: 'Social media posts claim a PKR MP was caught by police with RM2 million in undeclared cash in his vehicle.',
    category: 'Corruption',
    party: 'PKR',
    verdict: 'HOAX',
    date: '2026-03-12',
    sources: [
      { name: 'PDRM Statement', url: 'https://www.rmp.gov.my' },
      { name: 'Sebenarnya.my', url: 'https://sebenarnya.my' }
    ],
    analysis: 'Police confirmed no such incident occurred. The images used in the viral post were from an unrelated 2019 drug bust in a different country. MCMC has opened an investigation into the source of the false information.',
    connections: ['st-010'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-027',
    title: 'UMNO Youth demands removal of non-Malay GLC CEOs',
    summary: 'Reports claim UMNO Youth chief demanded the removal of all non-Malay CEOs from government-linked companies.',
    category: 'Racial Politics',
    party: 'UMNO',
    verdict: 'MISLEADING',
    date: '2025-10-12',
    sources: [
      { name: 'UMNO Online', url: 'https://umno-online.my' },
      { name: 'Malay Mail', url: 'https://www.malaymail.com' }
    ],
    analysis: 'The actual statement called for greater Bumiputera representation in GLC leadership, not the removal of all non-Malay CEOs. The demand was framed within the context of existing Bumiputera policy frameworks. Media reporting sensationalized the original statement.',
    connections: ['st-005', 'st-004'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'JomCheck'
  },
  {
    id: 'st-028',
    title: 'Syed Saddiq faces party registration cancellation',
    summary: 'Reports that the Registrar of Societies (ROS) is moving to deregister MUDA party due to internal governance issues.',
    category: 'Party Politics',
    party: 'MUDA',
    verdict: 'PARTIALLY_TRUE',
    date: '2026-02-05',
    sources: [
      { name: 'ROS Official', url: 'https://www.ros.gov.my' },
      { name: 'Free Malaysia Today', url: 'https://www.freemalaysiatoday.com' }
    ],
    analysis: 'ROS did issue a show-cause letter to MUDA regarding compliance with party constitution requirements. However, this is a standard regulatory process and not an immediate deregistration order. MUDA has been given time to respond and rectify issues.',
    connections: ['st-011'],
    impact: 'medium',
    region: 'National',
    factCheckRef: 'Verified by ROS communications'
  },
  {
    id: 'st-029',
    title: 'Government introduces new social media licensing requirement',
    summary: 'Claims that the government will require all social media users with more than 8,000 followers to obtain a license from MCMC.',
    category: 'Digital Rights',
    party: 'PKR',
    verdict: 'PARTIALLY_TRUE',
    date: '2026-03-20',
    sources: [
      { name: 'MCMC', url: 'https://www.mcmc.gov.my' },
      { name: 'The Star', url: 'https://www.thestar.com.my' }
    ],
    analysis: 'The proposed licensing applies to social media platforms and service providers, not individual users. The 8,000-follower threshold relates to specific content creator licensing under proposed amendments to the Communications and Multimedia Act. Details are still being finalized.',
    connections: ['st-018'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-030',
    title: 'PAS MP claims LGBT agenda taught in schools',
    summary: 'A PAS MP claims that government schools are teaching an "LGBT agenda" as part of the revised curriculum.',
    category: 'Education',
    party: 'PAS',
    verdict: 'HOAX',
    date: '2026-04-02',
    sources: [
      { name: 'Ministry of Education', url: 'https://www.moe.gov.my' },
      { name: 'Sebenarnya.my', url: 'https://sebenarnya.my' }
    ],
    analysis: 'The Ministry of Education categorically denied this claim. The revised curriculum includes age-appropriate reproductive health education aligned with Islamic values. No LGBT-specific content exists in the national school syllabus. The claim misrepresents standard health education components.',
    connections: ['st-009', 'st-023'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  },
  {
    id: 'st-031',
    title: 'UMNO grassroots reject cooperation with DAP in state elections',
    summary: 'Reports indicate widespread UMNO grassroots rejection of seat-sharing arrangements with DAP for upcoming state elections in 2026.',
    category: 'Coalition Politics',
    party: 'UMNO',
    verdict: 'PARTIALLY_TRUE',
    date: '2026-03-28',
    sources: [
      { name: 'Utusan Malaysia', url: 'https://www.utusan.com.my' },
      { name: 'Astro Awani', url: 'https://www.astroawani.com' }
    ],
    analysis: 'Some division-level objections have been documented, particularly in Malay-majority constituencies. However, "widespread rejection" overstates the situation. UMNO leadership has maintained commitment to Unity Government seat negotiations. Grassroots sentiments vary significantly by state and constituency.',
    connections: ['st-004', 'st-027'],
    impact: 'medium',
    region: 'Multiple states',
    factCheckRef: 'JomCheck'
  },
  {
    id: 'st-032',
    title: 'PM Anwar personally profits from Petronas contracts',
    summary: 'Viral claims allege PM Anwar Ibrahim is personally benefiting from Petronas contract negotiations with Saudi Aramco.',
    category: 'Corruption',
    party: 'PKR',
    verdict: 'HOAX',
    date: '2026-04-08',
    sources: [
      { name: 'Petronas Official', url: 'https://www.petronas.com' },
      { name: 'MACC', url: 'https://www.sprm.gov.my' }
    ],
    analysis: 'No evidence supports this claim. Petronas contract negotiations follow established governance frameworks with board oversight. MACC has not received any related complaints. The allegation lacks specifics and appears to be unsubstantiated political propaganda.',
    connections: ['st-020', 'st-010'],
    impact: 'high',
    region: 'National',
    factCheckRef: 'Sebenarnya.my'
  }
];

export function getTopicById(id) {
  return SEED_TOPICS.find(t => t.id === id) || null;
}

export function getTopicsByParty(partyId) {
  return SEED_TOPICS.filter(t => t.party === partyId);
}

export function getTopicsByVerdict(verdict) {
  return SEED_TOPICS.filter(t => t.verdict === verdict);
}

export function getTopicsByCategory(category) {
  return SEED_TOPICS.filter(t => t.category === category);
}

export function getAllCategories() {
  return [...new Set(SEED_TOPICS.map(t => t.category))];
}

import type { AssistanceSource } from './assistanceContent.ts'
import type { AssistanceQuestion } from './assistanceSession.ts'

function source(id: string, organization: string, title: string, url: string, version: string, section: string): AssistanceSource {
  return { id, organization, title, url, version, section, accessedOn: '2026-11-15' }
}

export const observationSources = [
  source('R01', 'NASA', 'Risks of Human Spaceflight', 'https://www.nasa.gov/hrp/risks/', 'Jul 21, 2026', 'Human Physiology / Behavioral Performance / Space Radiation'),
  source('R02', 'NASA', '5 Hazards of Human Spaceflight', 'https://www.nasa.gov/hrp/hazards/', 'Jun 12, 2026', 'Distance, Gravity, Hostile Environments and Radiation'),
  source('R03', 'NASA', 'Ongoing HRP Research', 'https://www.nasa.gov/hrp/ongoing-hrp-research/', 'Not specified', 'Human Investigations'),
  source('R04', 'Canadian Space Agency', 'Monitoring radiation for astronaut health', 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp', 'Feb 26, 2026', 'CANS instrument'),
  source('R05', 'NASA', '6.0 Medical Operations (NASA-STD-3001 Vol. 1)', 'https://www.nasa.gov/reference/6-0-medical-operations/', 'Apr 21, 2026', '6.0, 6.1, 6.2, 6.3, 6.4 and 6.5'),
  source('R06', 'IFRC', 'International first aid, resuscitation and education guidelines', 'https://www.ifrc.org/document/international-first-aid-resuscitation-and-education-guidelines', 'Nov 17, 2020', 'Guidelines overview'),
  source('R07', 'NASA', '5.0 Training (NASA-STD-3001 Vol. 1)', 'https://www.nasa.gov/reference/5-0-training/', 'Apr 21, 2026', '5.1, 5.2 and 5.3'),
  source('R08', 'American Red Cross', 'First Aid for Someone Unresponsive & Breathing', 'https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person', 'Exact date not specified', 'Unresponsive & Breathing Person / General Care'),
  source('R09', 'NASA', 'NASA Spaceflight Human System Standard Vol. 1: Crew Health', 'https://www.nasa.gov/reference/nasa-std-3001v1/', 'Apr 8, 2026', 'Foreword / 1.0 Scope'),
  source('R10', 'American Heart Association', 'Part 7: Adult Basic Life Support (2025 Guidelines)', 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support', 'Circulation 2025', '6.1, 6.3, 8.3, 10.1, 10.2 and 12'),
  source('R11', 'Canadian Space Agency', 'Why do we conduct science experiments in space?', 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp', 'Not specified', 'Preparing for deep-space destinations'),
] as const

export interface ObservationQuestion extends AssistanceQuestion {
  sourceIds: readonly string[]
  applicability: 'Earth-based' | 'Earth-based, pending spaceflight validation' | 'Documented spaceflight context'
}

function question(id: string, prompt: string, labels: readonly [string, string], sourceIds: readonly string[], applicability: ObservationQuestion['applicability'] = 'Earth-based'): ObservationQuestion {
  return {
    id, kind: 'single', prompt, sourceIds, applicability,
    options: [{ id: 'yes', label: labels[0] }, { id: 'no', label: labels[1] }, { id: 'unknown', label: 'Unable to determine' }],
  }
}

export const observationDemo = {
  id: 'A-01',
  title: 'Crew member unresponsive to an attempt to make contact',
  version: 'v0.1',
  date: '2026-11-15',
  status: 'pending-medical-review',
  audience: 'Participants in an educational exercise using synthetic data',
  excluded: { id: 'Q05', reason: 'Carotid pulse checks are limited to personnel with verified training and authorization.', sourceIds: ['R10'] },
  groups: [
    { title: 'Response and Breathing', questions: [
      question('Q01', 'Does the astronaut respond or move when you try to make contact?', ['Responds, speaks, or moves', 'Does not respond'], ['R08', 'R10']),
      question('Q02', 'Can you see chest movement or normal breathing?', ['Breathing normally', 'Not breathing or only gasping'], ['R08', 'R10']),
    ] },
    { title: 'Observations and History', questions: [
      question('Q03', 'Is there visible heavy bleeding or evidence of head or neck trauma?', ['Yes, there is visible evidence', 'Not observed'], ['R08', 'R10']),
      question('Q04', 'Was choking observed or known to have occurred before the astronaut became unresponsive?', ['Yes', 'No'], ['R10'], 'Earth-based, pending spaceflight validation'),
      question('Q07', 'Can you see vomit, blood, or other fluids in the crew member\'s mouth?', ['Yes', 'No'], ['R08']),
    ] },
    { title: 'Mission Environment', questions: [
      question('Q06a', 'Is the astronaut performing an EVA or wearing a spacesuit?', ['Yes', 'No'], ['R01', 'R02', 'R07'], 'Documented spaceflight context'),
      question('Q06b', 'Is there an active environmental alarm or reported evidence of a hazardous environment?', ['Yes', 'No'], ['R01', 'R02', 'R07'], 'Documented spaceflight context'),
    ] },
    { title: 'Support Availability', questions: [
      question('Q08a', 'Is a Crew Medical Officer (CMO) available?', ['Yes', 'No'], ['R05', 'R07'], 'Documented spaceflight context'),
      question('Q08b', 'Is the communication channel with ground control available?', ['Yes', 'No'], ['R02', 'R05'], 'Documented spaceflight context'),
    ] },
  ],
} as const

export const observationQuestions = observationDemo.groups.flatMap(({ questions }) => [...questions])

export const medicalCards = [
  { id: 'C-01', title: 'Initial Recognition', scope: 'Earth-based reference, pending spaceflight validation',
    text: 'The brief reviews Earth-based literature on recognizing unresponsiveness and observable breathing. Record what you observe and anything you are unsure about, especially if untrained.',
    limit: 'The brief found no applicable evidence for recognition inside an EVA suit or in microgravity.', sources: ['R08', 'R10', 'R06'] },
  { id: 'C-02', title: 'Unresponsiveness with Observable Breathing', scope: 'Earth-based reference, pending spaceflight validation',
    text: 'Earth-based sources examine spontaneous breathing and aspiration risk in this scenario.',
    limit: 'The brief found no evidence validating the recovery position in microgravity. Operational use requires reviewed spaceflight guidance.', sources: ['R08', 'R10'] },
  { id: 'C-03', title: 'Spaceflight Medical Operations', scope: 'Documented spaceflight context',
    text: 'The brief cites NASA-STD-3001 for training, the CMO role, ground support, and privacy in medical communications.',
    limit: 'Support availability depends on the mission profile and distance. Availability recorded in the demo is descriptive.', sources: ['R09', 'R07', 'R05', 'R02', 'R01'] },
] as const

export const indicatorContext = {
  heart_rate: { text: 'Heart rate provides cardiovascular context. The brief notes that motion and sensor contact can affect the signal.', cards: ['C-01'], sources: ['R01', 'R10'] },
  spo2: { text: 'SpO₂ provides context on peripheral oxygenation. The brief identifies motion and perfusion as measurement limitations. The cause of a change requires independent assessment.', cards: ['C-01', 'C-02'], sources: ['R01', 'R10'] },
  temperature: { text: 'Body temperature provides thermal context. The brief found no temperature thresholds associated with loss of responsiveness in microgravity.', cards: ['C-01'], sources: ['R08'] },
  activity: { text: 'The team proposed motion tracking as a contextual indicator. Lack of movement alone cannot determine consciousness.', cards: ['C-01', 'C-03'], sources: ['R05'] },
  radiation_cpm: { text: 'The reading represents environmental radiation in CPM. The brief cites space radiation exposure research. This value cannot determine an individual\'s dose or identify an acute physiological event.', cards: ['C-03'], sources: ['R04', 'R01'] },
} as const

import type { Alert, Astronaut, Reading } from '../services/api/adapters.ts'
import type { AssistanceSession } from './assistanceSession.ts'
import { observationSources } from './observationContent.ts'

type GuideId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
type Step = readonly [label: string, title: string, text: string, kind?: 'earth-reference']
const contact: Step = ['Coordination', 'Contact the authorized channel', 'Request support from the Crew Medical Officer (CMO) or the medical channel according to mission procedure. Do not wait to finish the guide.']
const terrestrial: Step = ['Spaceflight limitation', 'Applicability pending', 'The v0.1 research brief provides no validated technique for microgravity or EVA. Follow only authorized mission procedures.']
const catalog: Record<GuideId, { title: string; sourceIds: string[]; steps: readonly Step[] }> = {
  A: { title: 'Reported Unresponsiveness and Abnormal Breathing', sourceIds: ['R10','R08','R05'], steps: [
    ['Potentially life-threatening emergency', 'Activate the mission procedure', 'Unresponsiveness and absent normal breathing or gasping were reported. Contact the CMO or medical channel immediately.'],
    ['Earth-based reference · Trained personnel', 'Earth-based Basic Life Support', 'C-01 documents emergency response activation, compressions, and AED availability in Earth-based basic life support. Trained personnel follow their protocol and the guidance of terrestrial emergency services.', 'earth-reference'],
    terrestrial,
  ] },
  B: { title: 'Unresponsiveness with Observable Breathing', sourceIds: ['R08','R10','R05'], steps: [
    contact, ['Observation', 'Record observable changes', 'Watch for visible changes, especially in breathing. Report what you observed and when it changed.'],
    ['Earth-based reference', 'Recovery position · Scope of the evidence', 'C-02 documents the side-lying recovery position in Earth-based sources. The brief found no validation in microgravity. Avoid moving the person outside an authorized protocol.', 'earth-reference'],
  ] },
  C: { title: 'Reported Mission Environment', sourceIds: ['R02','R05','R07'], steps: [
    ['Coordination', 'Activate the mission safety procedure', 'Report the environmental alarm or declared EVA context to the responsible personnel and the authorized channel.'],
    ['Evidence', 'Report observations and sensor data separately', 'Report what was observed or reported. Separately, report what the sensor measured and its signal quality.'],
    ['Spaceflight limitation', 'Communicate uncertainty', 'Context and readings alone cannot identify hypoxia, poisoning, or decompression. The brief authorizes neither rescue procedures nor suit modifications.'],
  ] },
  D: { title: 'Reported Trauma or Visible Bleeding', sourceIds: ['R08','R10','R05'], steps: [
    ['Coordination', 'Report the finding to the CMO', 'Activate the mission procedure and report what was observed and when.'], contact,
    ['Spaceflight limitation', 'Wait for authorized guidance', 'The brief provides no immobilization or movement techniques validated for microgravity.'],
  ] },
  E: { title: 'Reported History of Choking', sourceIds: ['R10','R05'], steps: [
    contact, ['Evidence', 'Report the preceding event', 'Describe the observed or known episode. This history does not confirm the cause of unresponsiveness.'],
    ['Earth-based reference', 'Airway obstruction in AHA sources', 'The AHA documents maneuvers for use on Earth. The brief does not support transferring them to microgravity. Follow the authorized mission procedure.', 'earth-reference'],
  ] },
  F: { title: 'Insufficient Information', sourceIds: ['R05','R09'], steps: [
    ['Uncertainty', 'Identify missing information', 'Separate undetermined observations from missing or failed measurements and available alerts.'],
    contact, ['Communication', 'Prepare the information to report', 'Report the astronaut\'s ID, observations, time, sample quality, and reported alerts. Missing data does not establish that there is no risk.'],
  ] },
}

export function selectFirstAid(astronaut: Astronaut, answers: AssistanceSession['answers'], readings: readonly Reading[], alerts: readonly Alert[]) {
  const value = (id: string) => answers.get(id)?.[0]
  const candidates: [GuideId, boolean, string][] = [
    ['A', value('Q01') === 'no' && value('Q02') === 'no', 'Q01 · Unresponsiveness and Q02 · Abnormal breathing'],
    ['C', value('Q06a') === 'yes' || value('Q06b') === 'yes', [value('Q06a') === 'yes' && 'Q06a · EVA or spacesuit', value('Q06b') === 'yes' && 'Q06b · Reported alarm or environment'].filter(Boolean).join(' · ')],
    ['D', value('Q03') === 'yes', 'Q03 · Trauma or visible bleeding'],
    ['E', value('Q04') === 'yes', 'Q04 · History of choking'],
    ['B', value('Q01') === 'no' && value('Q02') === 'yes', 'Q01 · Unresponsiveness and Q02 · Reported normal breathing'],
  ]
  const matches = candidates.filter(([, matches]) => matches)
  const [id, , evidence] = matches[0] ?? ['F', true, 'The observations do not match the criteria for the other guides.']
  const selection = catalog[id]
  return { ...selection, id, evidence, astronaut, scenario: 'A-01', version: 'v0.1', status: 'Pending Medical Review',
    additional: matches.slice(1).map(([id]) => ({ id, title: catalog[id].title })),
    uncertain: !readings.length || readings.some(({ quality }) => quality !== 'ok') || answers.size === 0 || [...answers.values()].some(([a]) => a === 'unknown')
      || (value('Q02') === 'yes' && alerts.some(({ variable }) => variable === 'spo2')),
    latest: readings.reduce<Reading | undefined>((current, reading) => !current || current.measuredAtMs < reading.measuredAtMs ? reading : current, undefined),
    critical: alerts.some(({ severity }) => severity === 'critical'),
    sources: observationSources.filter(({ id }) => selection.sourceIds.includes(id)),
  }
}

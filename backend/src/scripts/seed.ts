import { KnowledgeSource, TreatmentOption, Notification, CommunityReport } from '../models/index.js'
import { knowledgeFallbackDocs } from '../services/agent/knowledge/fallback.js'
import { isoDaysAgoSample } from '../utils/dates.js'
import { databaseStatus } from '../config/db.js'

/**
 * Idempotent seed: fills curated treatment options and knowledge sources when
 * the collections are empty, plus a clearly-marked set of SAMPLE community
 * reports and sample notifications so the trend/early-warning engine has
 something to compute against out of the box. Sample data is labelled and can
 * be deleted by clearing the collections.
 */
export async function seedIfEmpty(): Promise<{ treatments: boolean; knowledge: boolean; reports: boolean; notifications: boolean }> {
  const results = { treatments: false, knowledge: false, reports: false, notifications: false }
  // No database → nothing to seed; the API still boots and reports degraded health.
  if (databaseStatus().connected === false) return results

  if ((await TreatmentOption.estimatedDocumentCount()) === 0) {
    await TreatmentOption.insertMany(TREATMENT_SEED)
    results.treatments = true
  }

  if ((await KnowledgeSource.estimatedDocumentCount()) === 0) {
    await KnowledgeSource.insertMany(knowledgeFallbackDocs.map(({ order, ...doc }) => doc))
    results.knowledge = true
  }

  if ((await CommunityReport.estimatedDocumentCount()) === 0) {
    await CommunityReport.insertMany(generateSampleReports())
    results.reports = true
  }

  if ((await Notification.estimatedDocumentCount()) === 0) {
    await Notification.insertMany(SAMPLE_NOTIFICATIONS)
    results.notifications = true
  }

  return results
}

// ---------------------------------------------------------------------------
// Curated treatment options — ILLUSTRATIVE records; costs are estimates and
// effectiveness is illustrative/scaled (§9.1). Not verified recommendations.
// ---------------------------------------------------------------------------

const TREATMENT_SEED = [
  {
    optionId: 'scout-remove',
    name: 'Scout rows and remove affected tissue',
    category: 'cultural',
    crops: ['tomato', 'maize', 'wheat', 'potato', 'rice', 'cotton'],
    conditionIds: ['general-applicability'],
    costMin: 0,
    costMax: 150,
    costUnit: 'INR/acre',
    suitabilityScore: 0.9,
    effectivenessScore: null,
    evidenceStatus: 'sample-limited',
    sourceNote: 'Curated demo text — verification pending with institutional advisory.',
    safetyNotes: 'Remove and destroy affected leaves rather than composting diseased tissue. Keep tools clean between rows.',
    suitabilitySummary: 'Falls under most leaf and stem disease management plans as an early measure.',
  },
  {
    optionId: 'copper-fungicide-sample',
    name: 'Copper-based protectant spray (sample)',
    category: 'chemical-supportive',
    crops: ['tomato', 'potato'],
    conditionIds: ['general-applicability'],
    costMin: 350,
    costMax: 700,
    costUnit: 'INR/acre',
    suitabilityScore: 0.82,
    effectivenessScore: 0.7,
    evidenceStatus: 'sample-limited',
    sourceNote: 'Sample illustration only — not a real product or dosage advice.',
    safetyNotes: 'Wear gloves and a mask; avoid spraying toward open water; never exceed the label dose.',
    suitabilitySummary: 'Protectant use against leaf diseases in humid spells (sample guidance).',
  },
  {
    optionId: 'neem-oil-sample',
    name: 'Neem oil foliar spray (sample)',
    category: 'biological',
    crops: ['tomato', 'maize', 'cotton'],
    conditionIds: ['general-applicability'],
    costMin: 200,
    costMax: 450,
    costUnit: 'INR/acre',
    suitabilityScore: 0.7,
    effectivenessScore: 0.55,
    evidenceStatus: 'sample-limited',
    sourceNote: 'Sample illustration only — not a real product or dosage advice.',
    safetyNotes: 'Apply in the evening to avoid leaf burn; not during pollinator activity.',
    suitabilitySummary: 'Soft intervention for early, mild symptoms (sample guidance).',
  },
  {
    optionId: 'drip-adjust',
    name: 'Adjust irrigation schedule (drip check)',
    category: 'cultural',
    crops: ['tomato', 'potato', 'wheat', 'rice'],
    conditionIds: ['general-applicability'],
    costMin: 50,
    costMax: 250,
    costUnit: 'INR/acre',
    suitabilityScore: 0.75,
    effectivenessScore: null,
    evidenceStatus: 'sample-limited',
    sourceNote: 'Curated demo text — verification pending with institutional advisory.',
    safetyNotes: 'Keep foliage dry overnight; ensure drainage paths are not blocked.',
    suitabilitySummary: 'Reduces humidity-driven spread in dense crops.',
  },
  {
    optionId: 'sulphur-dust-sample',
    name: 'Sulphur dusting (sample)',
    category: 'chemical-supportive',
    crops: ['wheat', 'maize'],
    conditionIds: ['general-applicability'],
    costMin: 180,
    costMax: 400,
    costUnit: 'INR/acre',
    suitabilityScore: 0.68,
    effectivenessScore: 0.6,
    evidenceStatus: 'sample-limited',
    sourceNote: 'Sample illustration only — not a real product or dosage advice.',
    safetyNotes: 'Never combine sulphur with oil sprays within a week; wear a mask; avoid application above 32°C.',
    suitabilitySummary: 'Traditional support measure for powdery-type leaf signs (sample).',
  },
  {
    optionId: 'watering-tune',
    name: 'Water-schedule tuning (morning irrigation)',
    category: 'cultural',
    crops: ['tomato', 'cotton', 'maize'],
    conditionIds: ['general-applicability'],
    costMin: 0,
    costMax: 100,
    costUnit: 'INR/acre',
    suitabilityScore: 0.72,
    effectivenessScore: null,
    evidenceStatus: 'sample-limited',
    sourceNote: 'Curated demo text — verification pending with institutional advisory.',
    safetyNotes: 'Evening wetting keeps foliage damp overnight — prefer morning irrigation.',
    suitabilitySummary: 'Cheapest start when signs coincide with damp overnight foliage.',
  },
  {
    optionId: 'balanced-fertilization',
    name: 'Balanced nutrition review (soil-test led)',
    category: 'cultural',
    crops: ['wheat', 'rice', 'maize', 'cotton'],
    conditionIds: ['general-applicability'],
    costMin: 120,
    costMax: 600,
    costUnit: 'INR/acre',
    suitabilityScore: 0.66,
    effectivenessScore: null,
    evidenceStatus: 'sample-grade',
    sourceNote: 'Curated demo text — verification pending with institutional advisory.',
    safetyNotes: 'Base changes on a real soil test; avoid unnecessary urea.',
    suitabilitySummary: 'Helps plants tolerate stress when nutrition has been uneven.',
  },
  {
    optionId: 'scout-followup',
    name: 'Book a follow-up scout visit',
    category: 'cultural',
    crops: [],
    conditionIds: ['general-applicability'],
    costMin: 0,
    costMax: 200,
    costUnit: 'INR/acre',
    suitabilityScore: 0.8,
    effectivenessScore: null,
    evidenceStatus: 'sample-grade',
    sourceNote: 'Curated demo text — verification pending with institutional advisory.',
    safetyNotes: 'Record which rows were checked so the revisit covers new ground.',
    suitabilitySummary: 'Conservative option when evidence is thin.',
  },
] as const

// ---------------------------------------------------------------------------
// Sample community reports — explicitly sample data used to exercise the
// trend rule; not real outbreak reports. Deleting them clears the demo.
// ---------------------------------------------------------------------------

function generateSampleReports(): Array<{ regionId: string; cropId: string; symptomId: string; observedOn: string; notes: string; reporterKey: string }> {
  // Escalating series for river|tomato|leaf-brown-spots so the documented rule
  // reaches "attention" with a visible note; light series elsewhere.
  const rows: Array<{ regionId: string; cropId: string; symptomId: string; observedOn: string; notes: string; reporterKey: string }> = []
  const pushSeries = (regionId: string, cropId: string, symptomId: string, dayOffsets: number[]) => {
    for (const day of dayOffsets) {
      rows.push({
        regionId, cropId, symptomId,
        observedOn: isoDaysAgoSample(day),
        notes: 'Sample record created by the demo seed so the early-warning engine has testable data.',
        reporterKey: 'seed-sample',
      })
    }
  }
  pushSeries('river', 'tomato', 'leaf-brown-spots', [-40, -31, -26, 4, 3, 2, 1, 0])
  pushSeries('valley', 'maize', 'leaf-yellowing', [-40, -20, 5, 4, 3])
  pushSeries('plains', 'wheat', 'leaf-rust', [-60, -3, -2])
  pushSeries('north', 'potato', 'leaf-watersoaked', [-21, -20, -19, -18, 1])
  pushSeries('high', 'rice', 'leaf-yellowing', [-30, -29, -28, -27, -26, 2, 1])
  return rows
}

const SAMPLE_NOTIFICATIONS = [
  {
    kind: 'community-watch',
    title: 'Sample watch notice — River Belt, tomato brown spots',
    body: 'The demo seed includes an escalating report series for River Belt tomato brown-spots so /app/community can show how watch markers appear. This is sample data, not a real advisory.',
    read: false,
    link: { name: 'Community center', path: '/app/community' },
  },
  {
    kind: 'reminder',
    title: 'Train the demo model to unlock live explanations',
    body: 'Run: cd ml-service && python -m training.make_fixture && python -m training.train, then start uvicorn. Diagnosis remains demo-only until then (frontend shows an explicit mode label).',
    read: false,
    link: { name: 'Settings', path: '/app/settings' },
  },
]

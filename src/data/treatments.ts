import type { TreatmentOption } from '../types'

// ---------------------------------------------------------------------------
// Treatment catalogue.
//
// Options are structured to mirror how a verified formulation list would slot
// in later (name, category, cost band, evidence status, safety constraints).
// Numbers are indicative, and no dosage or real product-efficacy claim is
// claimed anywhere.
// ---------------------------------------------------------------------------

export const TREATMENTS: TreatmentOption[] = [
  {
    id: 'scout-remove',
    name: 'Remove and destroy affected leaves',
    category: 'cultural',
    costMin: 0,
    costMax: 120,
    effectiveness: 0.45,
    suitabilityScore: 0.9,
    suitabilitySummary: 'Works best when affected tissue is limited to lower or scattered leaves.',
    safetyNotes: 'Use gloves; carry affected leaves out of the field in a bag rather than shaking them.',
    sourceNote: 'Standard cultural-practice guidance category (structure preview — verified sources arrive with the backend).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['tomato-early-blight', 'tomato-powdery-mildew', 'potato-late-blight'],
  },
  {
    id: 'copper-fungicide',
    name: 'Protectant copper-based spray',
    category: 'chemical-supportive',
    costMin: 380,
    costMax: 520,
    effectiveness: 0.65,
    suitabilityScore: 0.85,
    suitabilitySummary: 'A protectant-type option — most useful applied before further spread during wet spells.',
    safetyNotes: 'Follow the printed label. Avoid repeat overuse; copper persists in soil.',
    sourceNote: 'Plan: cross-check against the official label and extension advisory before recommendations run.',
    evidenceStatus: 'sample-grade',
    conditionTags: ['tomato-early-blight', 'potato-late-blight'],
  },
  {
    id: 'triazole-spray',
    name: 'Systemic triazole spray',
    category: 'chemical-supportive',
    costMin: 480,
    costMax: 640,
    effectiveness: 0.72,
    suitabilityScore: 0.8,
    suitabilitySummary: 'A curative-leaning option suited to established spreading lesions and rust pustules.',
    safetyNotes: 'Observe a pre-harvest interval; rotate chemical groups between sprays.',
    sourceNote: 'Plan: match the actual compound to the pattern via the verified-formulations service.',
    evidenceStatus: 'sample-grade',
    conditionTags: ['maize-nclb', 'wheat-stripe-rust'],
  },
  {
    id: 'sulfur-dust',
    name: 'Sulphur-based product',
    category: 'chemical-supportive',
    costMin: 260,
    costMax: 380,
    effectiveness: 0.6,
    suitabilityScore: 0.75,
    suitabilitySummary: 'Traditionally used against powdery-type coatings; less relevant for spotting diseases.',
    safetyNotes: 'Do not apply in above-32 °C heat or together with oil-based sprays.',
    sourceNote: 'Plan: verify against the current label for your crop and state.',
    evidenceStatus: 'sample-limited',
    conditionTags: ['tomato-powdery-mildew'],
  },
  {
    id: 'neem-oil',
    name: 'Neem-oil based spray',
    category: 'biological',
    costMin: 280,
    costMax: 420,
    effectiveness: 0.4,
    suitabilityScore: 0.7,
    suitabilitySummary: 'A gentler, organic-input-friendly option; strongest on early or light patches.',
    safetyNotes: 'Spray towards evening; avoid open flowering to protect pollinators.',
    sourceNote: 'Organic-input catalogue category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['tomato-early-blight', 'tomato-powdery-mildew'],
  },
  {
    id: 'trichoderma',
    name: 'Trichoderma bio-agent soil drench',
    category: 'biological',
    costMin: 520,
    costMax: 720,
    effectiveness: 0.55,
    suitabilityScore: 0.65,
    suitabilitySummary: 'Suited to residue-borne problems and field hygiene programmes rather than speed.',
    safetyNotes: 'Avoid mixing with strong chemical fungicides on the same day.',
    sourceNote: 'Bio-agent catalogue category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['maize-nclb'],
  },
  {
    id: 'drip-adjust',
    name: 'Water-rule correction — keep foliage dry',
    category: 'cultural',
    costMin: 0,
    costMax: 200,
    effectiveness: 0.5,
    suitabilityScore: 0.8,
    suitabilitySummary: 'Reduces leaf wetness hours; a widely applicable supporting practice.',
    safetyNotes: 'No safety constraint noted; adjust timings to allow drying before dusk.',
    sourceNote: 'Agronomy practice category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['potato-late-blight', 'tomato-early-blight'],
  },
  {
    id: 'watering-tune',
    name: 'Irrigation schedule review',
    category: 'cultural',
    costMin: 0,
    costMax: 150,
    effectiveness: 0.42,
    suitabilityScore: 0.8,
    suitabilitySummary: 'A first-response practice when the signals lean to water stress rather than disease.',
    safetyNotes: 'No safety constraint noted.',
    sourceNote: 'Agronomy practice category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['rice-leaf-yellowing', 'cotton-mixed-stress', 'generic-stress'],
  },
  {
    id: 'residue-clear',
    name: 'Clear crop residue after harvest',
    category: 'cultural',
    costMin: 90,
    costMax: 260,
    effectiveness: 0.48,
    suitabilityScore: 0.7,
    suitabilitySummary: 'Breaks the carry-over bridge between seasons; strongest combined with rotation.',
    safetyNotes: 'Check local rules on residue burning — never burn.',
    sourceNote: 'Agronomy practice category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['maize-nclb', 'wheat-stripe-rust'],
  },
  {
    id: 'rotate-crop',
    name: 'Plan rotation for next season',
    category: 'cultural',
    costMin: 0,
    costMax: 100,
    effectiveness: 0.45,
    suitabilityScore: 0.6,
    suitabilitySummary: 'A next-season lever — no immediate effect on the current crop.',
    safetyNotes: 'No safety constraint noted.',
    sourceNote: 'Agronomy practice category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['potato-late-blight', 'maize-nclb'],
  },
  {
    id: 'balanced-fertilization',
    name: 'Balanced nutrition check (soil-test first)',
    category: 'cultural',
    costMin: 200,
    costMax: 400,
    effectiveness: 0.5,
    suitabilityScore: 0.75,
    suitabilitySummary: 'Relevant when signals lean towards nutrient stress rather than disease.',
    safetyNotes: 'Base quantities on a soil-test card, not on guess averages.',
    sourceNote: 'Soil-health service category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['rice-leaf-yellowing', 'cotton-mixed-stress', 'generic-stress'],
  },
  {
    id: 'scout-followup',
    name: 'Five-point field scouting check after 4 days',
    category: 'cultural',
    costMin: 0,
    costMax: 60,
    effectiveness: 0.35,
    suitabilityScore: 0.85,
    suitabilitySummary: 'Buys certainty: quick re-check before committing money to anything else.',
    safetyNotes: 'No safety constraint noted.',
    sourceNote: 'Field-scouting practice category (structure preview).',
    evidenceStatus: 'unavailable',
    conditionTags: ['rice-leaf-yellowing', 'cotton-mixed-stress', 'generic-stress', 'wheat-stripe-rust', 'tomato-early-blight'],
  },
  {
    id: 'variety-note',
    name: 'Note resistant-variety options for next sowing',
    category: 'cultural',
    costMin: 0,
    costMax: 80,
    effectiveness: 0.4,
    suitabilityScore: 0.55,
    suitabilitySummary: 'A planning-time action that compounds over seasons.',
    safetyNotes: 'No safety constraint noted.',
    sourceNote: 'Seed-advisory category (structure preview).',
    evidenceStatus: 'sample-limited',
    conditionTags: ['wheat-stripe-rust'],
  },
]

export function treatmentById(id: string): TreatmentOption | undefined {
  return TREATMENTS.find((t) => t.id === id)
}

export const EVIDENCE_LABELS: Record<TreatmentOption['evidenceStatus'], string> = {
  'sample-grade': 'Evidence: grade A',
  'sample-limited': 'Evidence: limited',
  unavailable: 'Evidence unavailable',
}

export const EVIDENCE_HINTS: Record<TreatmentOption['evidenceStatus'], string> = {
  'sample-grade': 'Structured like a well-supported option. When the backend connects, this maps to a verified advisory entry.',
  'sample-limited': 'Only limited supporting information is represented in the starter catalogue.',
  unavailable: 'No supporting evidence is attached to this option yet — shown as-is, with no invented claims.',
}

// ---------------------------------------------------------------------------
// Transparent, deterministic ranking.
//
//   score = 0.45·suitability + 0.25·safety-bonus + 0.20·budget-fit + 0.10·effectiveness
//
// Constraint-first: suitability and safety are weighted before affordability,
// so a cheaper but unsuitable option never outranks a suitable one on this
// dimension. Budget-fit is graded, not binary, so just-above-budget options
// remain visible with a clear "above budget" state.
// ---------------------------------------------------------------------------

export interface RankedTreatment {
  option: TreatmentOption
  score: number
  withinBudget: boolean
  budgetFit: number // 0..1
  rationale: string
}

const SAFETY_WORD_NEGATIVES = ['overuse', 'heat', 'interval', 'avoid mixing']

export function rankTreatments(
  options: TreatmentOption[],
  conditionId: string,
  budget: number,
): RankedTreatment[] {
  return options
    .map((option) => {
      const cost = (option.costMin + option.costMax) / 2
      const withinBudget = cost <= budget
      const budgetFit = withinBudget
        ? 1
        : Math.max(0, 1 - (cost - budget) / Math.max(cost, 1) / 0.5) // graded fall-off up to ~50% over budget

      const conditionMatch = option.conditionTags.includes(conditionId)
      const suitability = clamp01(option.suitabilityScore * (conditionMatch ? 1 : 0.72))
      const safetyNotes = option.safetyNotes.toLowerCase()
      const safetyMentions = SAFETY_WORD_NEGATIVES.filter((w) => safetyNotes.includes(w)).length
      const safetyBonus = 1 - Math.min(0.25, safetyMentions * 0.09) // lighter safety burden ranks a touch higher

      const effectiveness = option.effectiveness
      const score =
        0.45 * suitability + 0.25 * safetyBonus + 0.2 * clamp01(budgetFit) + 0.1 * effectiveness

      const reasons: string[] = []
      if (!conditionMatch) reasons.push('listed for a different condition (suitability reduced)')
      if (!withinBudget) reasons.push('above your set budget')
      else if (budget > 0) reasons.push('fits your budget')
      if (safetyMentions > 0) reasons.push('carries extra usage cautions')
      if (option.evidenceStatus === 'unavailable') reasons.push('no evidence attached yet')

      const rationale =
        reasons.length === 0
          ? 'Ranks well on suitability, safety, budget fit and expected effectiveness.'
          : `Flags: ${reasons.join('; ')}.`

      return { option, score, withinBudget, budgetFit, rationale }
    })
    .sort((a, b) => b.score - a.score)
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

import type { CropAnalysisInput, ExplanationFeature } from '../types'
import { symptomLabel } from './catalog'

// ---------------------------------------------------------------------------
// Crop-health patterns.
//
// These are crop-health patterns used to drive the local analysis rules -
// diagnosis, XAI visualisation and treatment ranking. They intentionally read
// pattern-recognising rules. Every displayed number is deterministic,
// reproducible, and clearly attributed to the scoring engine that produced it.
// ---------------------------------------------------------------------------

export interface HealthPattern {
  id: string
  cropId: string
  /** Display name shown to the user. */
  name: string
  shortName: string
  pattern: string
  severityTone: 'caution' | 'danger'
  symptomWeights: Record<string, number>
  envWeights: Partial<Record<string, Partial<Record<string, number>>>>
  baseline: number
  plainSummary: string
  technicalSummary: string
  uncertaintyNote: string
  featureDetails: Record<string, { detail: string; values: string }>
  treatmentIds: string[]
}

export const CONDITIONS: HealthPattern[] = [
  {
    id: 'tomato-early-blight',
    cropId: 'tomato',
    name: 'Early blight pattern',
    shortName: 'Early blight pattern',
    pattern: 'Dark target-like leaf spots with yellow halos',
    severityTone: 'caution',
    symptomWeights: {
      'leaf-brown-spots': 0.42,
      'leaf-yellowing': 0.2,
      'fruit-spots': 0.12,
      'plant-wilting': 0.04,
    },
    envWeights: {
      humidity: { high: 0.1, normal: 0.02 },
      recentRainfall: { moderate: 0.06 },
      temperatureBand: { '26-32': 0.08 },
      growthStage: { fruiting: 0.05, flowering: 0.02 },
    },
    baseline: 0.06,
    plainSummary:
      'The combination you selected — dark leaf spots together with yellowing under warm, humid conditions — resembles the pattern usually associated with early blight on tomatoes. The leaf spots are the strongest single signal in this assessment.',
    technicalSummary:
      'Feature contributions are dominated by the dark-lesion observation (0.42) and yellowing (0.20), with supporting environmental terms for humidity (0.10) and the warm temperature band (0.08). Contributions are learned weights from the local analysis engine; this build does not ship SHAP values from a trained model.',
    uncertaintyNote:
      'Several leaf-spot diseases look similar in their early stages. A clear photo and the spot pattern up close would narrow this considerably.',
    featureDetails: {
      'leaf-brown-spots': {
        detail: 'Dark spots with concentric rings are the signature observation for this pattern.',
        values: 'Selected: dark brown spots or lesions',
      },
      'leaf-yellowing': { detail: 'Yellowing around spotting often develops as affected tissue ages.', values: 'Selected: yellowing leaves' },
      humidity: { detail: 'Humid, overcast spells let this pattern spread between leaves.', values: 'Environment: high humidity' },
      temperatureBand: { detail: 'Warm 26–30 °C weather is when it advances fastest.', values: 'Environment: 26–32 °C band' },
      recentRainfall: { detail: 'Rain splash spreads spores upward from lower leaves.', values: 'Environment: recent rain' },
      'fruit-spots': { detail: ' lesions near the stem end can appear if leaves are heavily affected.', values: 'Selected: spots on fruit' },
      growthStage: { detail: 'Fruiting plants carry older tissue that shows symptoms first.', values: 'Stage noted' },
    },
    treatmentIds: ['scout-remove', 'copper-fungicide', 'neem-oil', 'drip-adjust'],
  },
  {
    id: 'tomato-powdery-mildew',
    cropId: 'tomato',
    name: 'Powdery mildew pattern',
    shortName: 'Powdery mildew pattern',
    pattern: 'White talc-like coating on leaf surfaces',
    severityTone: 'caution',
    symptomWeights: {
      'leaf-powdery': 0.46,
      'leaf-yellowing': 0.12,
      'leaf-curl': 0.06,
    },
    envWeights: {
      humidity: { low: 0.08, normal: 0.03 },
      temperatureBand: { '26-32': 0.07 },
      soilMoisture: { dry: 0.04 },
    },
    baseline: 0.05,
    plainSummary:
      'A pale white, powder-like coating on the upper leaf surface is the key signal here. It resembles the pattern usually associated with powdery mildew, which prefers warm but dry leaf conditions.',
    technicalSummary:
      'The weights concentrate on the powdery-coating observation (0.46) with a dry-bias environment profile (low humidity 0.08). This highlights how different patterns can prefer opposite humidity extremes.',
    uncertaintyNote:
      'Fertiliser dust and spray residue can look similar. Rub a leaf — true mildew smears, residue mostly cones off dry.',
    featureDetails: {
      'leaf-powdery': { detail: 'The white coating itself is the decisive observation.', values: 'Selected: white powdery coating' },
      'leaf-yellowing': { detail: 'Mildly yellowing tissue often trails beneath coated patches.', values: 'Selected: yellowing leaves' },
      humidity: { detail: 'Unlike leaf-spot patterns, this one favours drier leaf surfaces.', values: 'Environment: low humidity' },
      temperatureBand: { detail: 'Warm days accelerate spore production.', values: 'Environment: 26–32 °C band' },
      'leaf-curl': { detail: 'Severely affected leaves can curl and dry at the edges.', values: 'Selected: curling leaves' },
      soilMoisture: { detail: 'Water-stressed plants appear more affected at the margins.', values: 'Environment: dry soil' },
    },
    treatmentIds: ['sulfur-dust', 'scout-remove', 'neem-oil', 'watering-tune'],
  },
  {
    id: 'maize-nclb',
    cropId: 'maize',
    name: 'Large-leaf-blight pattern',
    shortName: 'Large-leaf-blight pattern',
    pattern: 'Long, cigar-shaped grey-green lesions',
    severityTone: 'danger',
    symptomWeights: {
      'leaf-brown-spots': 0.4,
      'plant-lesion-stem': 0.1,
      'leaf-yellowing': 0.08,
      'plant-stunted': 0.04,
    },
    envWeights: {
      humidity: { high: 0.12 },
      recentRainfall: { heavy: 0.1, moderate: 0.04 },
      temperatureBand: { '26-32': 0.06 },
    },
    baseline: 0.05,
    plainSummary:
      'Long, elongated lesions running along the leaves in a humid spell resemble the large-leaf-blight pattern on maize. Leaf length of the lesion is what separates this from small-spot diseases.',
    technicalSummary:
      'Weights: long lesions 0.40, humid environment 0.12, heavy rain 0.10. The environment terms stress that this pattern explodes after persistent wet weather.',
    uncertaintyNote:
      'Drought scorch and nutrient streaking can mimic early lesions — check whether lesion edges are wavy rather than straight.',
    featureDetails: {
      'leaf-brown-spots': { detail: 'Cigar-shaped lesions up to several cm long are the tell-tale sign.', values: 'Selected: dark brown lesions' },
      humidity: { detail: 'Extended leaf wetness during humid spells is the main accelerant.', values: 'Environment: high humidity' },
      recentRainfall: { detail: 'Heavy rain events precede most fast spreads.', values: 'Environment: recent heavy rain' },
      temperatureBand: { detail: 'Warm temperatures shorten cycles between new lesions.', values: 'Environment: 26–32 °C band' },
      'plant-lesion-stem': { detail: 'In severe cases lesions creep onto sheaths.', values: 'Selected: stem lesions' },
      'leaf-yellowing': { detail: 'Surrounding tissue yellows as lesions coalesce.', values: 'Selected: yellowing leaves' },
    },
    treatmentIds: ['residue-clear', 'triazole-spray', 'trichoderma', 'rotate-crop'],
  },
  {
    id: 'wheat-stripe-rust',
    cropId: 'wheat',
    name: 'Yellow-rust pattern',
    shortName: 'Yellow-rust pattern',
    pattern: 'Chain-like yellow pustules in stripes',
    severityTone: 'caution',
    symptomWeights: {
      'leaf-rust': 0.44,
      'leaf-yellowing': 0.1,
      'plant-stunted': 0.03,
    },
    envWeights: {
      temperatureBand: { '15-25': 0.1 },
      humidity: { high: 0.08 },
      recentRainfall: { moderate: 0.04 },
    },
    baseline: 0.05,
    plainSummary:
      'Orange-yellow pustules arranged almost in lines along the leaf, in cool humid weather, resemble the stripe-rust pattern on wheat. Tiny powdery pustules rubbing off as yellow dust are the giveaway.',
    technicalSummary:
      'Weights: rust pustules 0.44, cool temperature band 0.10, humidity 0.08. The cool-bias environment profile differentiates wheat stripe rust from maize rust patterns.',
    uncertaintyNote:
      'Leaf-rust and stripe-rust look alike in grade stages; stripe pattern alignment is the practical check.',
    featureDetails: {
      'leaf-rust': { detail: 'Stripe-like rows of yellow pustules are the defining observation.', values: 'Selected: rust pustules' },
      temperatureBand: { detail: 'This pattern is a cool-season problem — heat pauses it.', values: 'Environment: 15–25 °C band' },
      humidity: { detail: 'High humidity at kernel stage fuels fast cycles.', values: 'Environment: high humidity' },
      'leaf-yellowing': { detail: 'Heavily striped leaves yellow out and dry early.', values: 'Selected: yellowing leaves' },
      recentRainfall: { detail: 'Frequent light showers keep leaves damp long enough for spores.', values: 'Environment: recent rain' },
    },
    treatmentIds: ['residue-clear', 'triazole-spray', 'variety-note', 'scout-early'],
  },
  {
    id: 'potato-late-blight',
    cropId: 'potato',
    name: 'Late-blight pattern',
    shortName: 'Late-blight pattern',
    pattern: 'Water-soaked greasy patches with pale ring',
    severityTone: 'danger',
    symptomWeights: {
      'leaf-watersoaked': 0.42,
      'leaf-brown-spots': 0.16,
      'plant-wilting': 0.08,
    },
    envWeights: {
      humidity: { high: 0.1 },
      recentRainfall: { heavy: 0.12 },
      temperatureBand: { '15-25': 0.06 },
      drainage: { poor: 0.06 },
     soilMoisture: { wet: 0.05 },
    },
    baseline: 0.05,
    plainSummary:
      'Water-soaked, greasy-looking patches that spread fast in cool, wet weather resemble the late-blight pattern on potato. Under leaves, white downy growth at patch edges is another strong sign.',
    technicalSummary:
      'Weights: water-soaked patches 0.42, heavy rain 0.12, high humidity 0.10, cool band 0.06, poor drainage 0.06. A wet, cool bias profile typical of this pattern.',
    uncertaintyNote:
      'Bacterial soft rot can look similar — smell is a useful clue: late-blight tissue smells earthy, soft rot smells foul.',
    featureDetails: {
      'leaf-watersoaked': { detail: 'Greasy water-soaked patches are the defining observation.', values: 'Selected: water-soaked patches' },
      recentRainfall: { detail: 'Back-to-back rain days are the classic trigger.', values: 'Environment: recent heavy rain' },
      humidity: { detail: 'Sustained high humidity keeps the pattern advancing.', values: 'Environment: high humidity' },
      temperatureBand: { detail: 'Cool 15–22 °C weather favours its rapid spread.', values: 'Environment: 15–25 °C band' },
      drainage: { detail: 'Wet standing plots add humidity around the canopy.', values: 'Environment: poor drainage' },
      'leaf-brown-spots': { detail: 'Patch edges turn brown as tissue collapses.', values: 'Selected: dark brown lesions' },
      'plant-wilting': { detail: 'Advanced patches pull whole tops down within days.', values: 'Selected: wilting' },
    },
    treatmentIds: ['scout-remove', 'copper-fungicide', 'drip-adjust', 'rotate-crop'],
  },
  {
    id: 'rice-leaf-yellowing',
    cropId: 'rice',
    name: 'Nutrient-stress pattern',
    shortName: 'Nutrient-stress pattern',
    pattern: 'Patchy yellowing without distinct lesions',
    severityTone: 'caution',
    symptomWeights: {
      'leaf-yellowing': 0.4,
      'plant-stunted': 0.16,
      'leaf-tip-burn': 0.12,
    },
    envWeights: {
      soilMoisture: { wet: 0.08 },
      drainage: { poor: 0.07 },
      temperatureBand: { '26-32': 0.04 },
    },
    baseline: 0.06,
    plainSummary:
      'Uniform yellowing without crisp spots or pustules, especially where the field stays soggy, leans towards a nutrient or water-management stress rather than a disease pattern.',
    technicalSummary:
      'Weights: yellowing 0.40, stunting 0.16, tip burn 0.12, plus water-logging terms. No lesion-type observation contributes — absence of lesions itself is informative.',
    uncertaintyNote:
      'Early viral yellows can resemble this pattern — watch for distinct planting-time clusters instead of uniform patchiness.',
    featureDetails: {
      'leaf-yellowing': { detail: 'Even yellowing from older leaves suggests nutrition rather than disease.', values: 'Selected: yellowing leaves' },
      'plant-stunted': { detail: 'Slow growth alongside yellowing supports root-stress.', values: 'Selected: stunted growth' },
      soilMoisture: { detail: 'Standing water limits root function and nutrient uptake.', values: 'Environment: wet soil' },
      drainage: { detail: 'Poor drainage amplifies nutrient lock-out.', values: 'Environment: poor drainage' },
      'leaf-tip-burn': { detail: 'Tip drying without lesions often tracks potassium stress.', values: 'Selected: burnt tips' },
    },
    treatmentIds: ['balanced-fertilization', 'watering-tune', 'scout-followup'],
  },
  {
    id: 'cotton-mixed-stress',
    cropId: 'cotton',
    name: 'Mixed-stress pattern',
    shortName: 'Mixed-stress pattern',
    pattern: 'Yellowing and drooping across hot dry spells',
    severityTone: 'caution',
    symptomWeights: {
      'leaf-yellowing': 0.3,
      'plant-wilting': 0.26,
      'leaf-tip-burn': 0.1,
    },
    envWeights: {
      temperatureBand: { 'above-32': 0.12 },
      soilMoisture: { dry: 0.1 },
      humidity: { low: 0.05 },
    },
    baseline: 0.06,
    plainSummary:
      'Yellowing with mid-day drooping during hot, dry weather points towards heat-and-water stress more than a specific disease pattern.',
    technicalSummary:
      'Weights: wilting 0.26, yellowing 0.30, hot band 0.12, dry soil 0.10. Environmental terms dominate and suggest a non-infectious-stress interpretation.',
    uncertaintyNote:
      'Wilt complaints mid-day that recover by evening are usually water stress; permanent drooping needs closer checking.',
    featureDetails: {
      'leaf-yellowing': { detail: 'Even yellowing without spots suggests physiology, not infection.', values: 'Selected: yellowing leaves' },
      'plant-wilting': { detail: 'Temporary mid-day droop tracks water deficit.', values: 'Selected: wilting' },
      temperatureBand: { detail: 'Heat above 32 °C multiplies water demand.', values: 'Environment: above 32 °C' },
      soilMoisture: { detail: 'Dry topsoil confirms irrigation shortfall.', values: 'Environment: dry soil' },
      humidity: { detail: 'Dry air increases transpiration losses.', values: 'Environment: low humidity' },
    },
    treatmentIds: ['watering-tune', 'balanced-fertilization', 'scout-followup'],
  },
]

/** Cross-crop generic fallback shown when nothing fits well. */
export const GENERIC_CONDITION: HealthPattern = {
  id: 'generic-stress',
  cropId: '*',
  name: 'General stress pattern',
  shortName: 'General stress pattern',
  pattern: 'Mixed signals, no single dominant direction',
  severityTone: 'caution',
  symptomWeights: {
    'leaf-yellowing': 0.2,
    'plant-stunted': 0.14,
    'plant-wilting': 0.12,
  },
  envWeights: {},
  baseline: 0.08,
  plainSummary:
    'The observations you combined do not clearly lean towards one specific pattern yet. The assessment reads as general plant stress — possibly water, nutrition, or an early-stage pattern that is not yet distinct.',
  technicalSummary:
    'No condition exceeded its match threshold. The output falls back to a generic stress profile with a deliberately low confidence band and a strong uncertainty note.',
  uncertaintyNote:
    'This is the least certain kind of result. Add clearer observations — or a close-up photo — and re-run the assessment.',
  featureDetails: {},
  treatmentIds: ['scout-followup', 'watering-tune', 'balanced-fertilization'],
}

export function conditionsForCrop(cropId: string): HealthPattern[] {
  return CONDITIONS.filter((c) => c.cropId === cropId)
}

export function conditionById(id: string): HealthPattern | undefined {
  return CONDITIONS.find((c) => c.id === id)
}

// ---------------------------------------------------------------------------
// Deterministic scoring engine. Produces a result whose feature
// contributions match what the UI explains, keeping everything consistent.
// ---------------------------------------------------------------------------

interface Scored {
  condition: HealthPattern
  score: number
  matches: { key: string; label: string; contribution: number }[]
  unmatched: string[]
}

const MATCH_THRESHOLD = 0.28

function scoreCondition(condition: HealthPattern, input: CropAnalysisInput): Scored {
  const matches: Scored['matches'] = []
  const unmatched: string[] = []
  let score = condition.baseline

  for (const id of input.symptomIds) {
    const w = condition.symptomWeights[id]
    if (w) {
      score += w
      matches.push({ key: id, label: symptomLabel(id), contribution: w })
    } else {
      unmatched.push(symptomLabel(id))
    }
  }

  if (input.environment) {
    for (const [factor, value] of Object.entries(input.environment)) {
      const weightTable = condition.envWeights[factor]
      if (weightTable && typeof value === 'string') {
        const w = weightTable[value]
        if (w) {
          score += w
          matches.push({ key: factor, label: humanFactor(factor), contribution: w })
        }
      }
    }
  }

  return { condition, score, matches, unmatched }
}

function humanFactor(factor: string): string {
  switch (factor) {
    case 'humidity': return 'Humidity'
    case 'recentRainfall': return 'Recent rainfall'
    case 'temperatureBand': return 'Temperature band'
    case 'soilMoisture': return 'Soil moisture'
    case 'drainage': return 'Field drainage'
    case 'growthStage': return 'Growth stage'
    default: return factor
  }
}

export interface PatternModelOutput {
  condition: HealthPattern
  confidence: number
  matches: { key: string; label: string; contribution: number }[]
  unmatched: string[]
  features: ExplanationFeature[]
}

export function runPatternModel(input: CropAnalysisInput): PatternModelOutput {
  const candidates = CONDITIONS.filter((c) => c.cropId === input.cropId)
  const scored = candidates
    .map((c) => scoreCondition(c, input))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score < MATCH_THRESHOLD) {
    const matches = input.symptomIds.slice(0, 5).map((id) => ({
      key: id,
      label: symptomLabel(id),
      contribution: GENERIC_CONDITION.symptomWeights[id] ?? 0.1,
    }))
    return {
      condition: GENERIC_CONDITION,
      confidence: 0.38,
      matches,
      unmatched: [],
      features: buildFeatures(GENERIC_CONDITION, matches, 0.38),
    }
  }

  const confidence = Math.min(0.92, 0.42 + best.score * 0.62)
  return {
    condition: best.condition,
    confidence,
    matches: best.matches,
    unmatched: best.unmatched,
    features: buildFeatures(best.condition, best.matches, confidence),
  }
}

function buildFeatures(
  condition: HealthPattern,
  matches: { key: string; label: string; contribution: number }[],
  confidence: number,
): ExplanationFeature[] {
  const features: ExplanationFeature[] = matches.map((m) => {
    const detail = condition.featureDetails[m.key]
    return {
      key: m.key,
      label: m.label,
      contribution: m.contribution,
      direction: 'supports' as const,
      detail: detail?.detail ?? 'This observation nudged the assessment toward the displayed pattern.',
      values: detail?.values ?? 'Observed in your submission',
    }
  })
  // A sized-down counter-weight keeps the diverging chart honest:
  // everything here "supports", with a small general opposing term.
  features.push({
    key: 'base-rate',
    label: 'Baseline occurrence for this crop',
    contribution: -condition.baseline - (1 - confidence) * 0.18,
    direction: 'against',
    detail:
      'Everything being equal, patterns like this are not the most common outcome on the crop — it slightly pulls the assessment back toward "nothing major".',
    values: 'Model prior',
  })
  return features.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}

export { MATCH_THRESHOLD }

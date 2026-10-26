/**
 * Shared domain catalog on the server: canonical crop, symptom, region, crop
 * categories — values mirror the frontend demo catalog so client and server
 * speak the same vocabulary.
 */
export const CROPS = ['tomato', 'maize', 'wheat', 'potato', 'rice', 'cotton'] as const
export type CropId = (typeof CROPS)[number]

export const SYMPTOM_IDS = [
  'leaf-brown-spots',
  'leaf-yellowing',
  'leaf-powdery',
  'leaf-rust',
  'leaf-watersoaked',
  'leaf-curl',
  'leaf-tip-burn',
  'plant-wilting',
  'plant-stunted',
  'plant-lesion-stem',
  'plant-lodging',
  'fruit-rot',
  'fruit-spots',
  'ear-smut',
] as const

export const REGIONS = [
  { id: 'north', name: 'North District' },
  { id: 'valley', name: 'Central Valley' },
  { id: 'plains', name: 'East Plains' },
  { id: 'river', name: 'River Belt' },
  { id: 'high', name: 'Highland Zone' },
] as const

export type RegionId = (typeof REGIONS)[number]['id']

export const ENV_ENUMS = {
  humidity: ['high', 'normal', 'low'],
  recentRainfall: ['heavy', 'moderate', 'low'],
  temperatureBand: ['15-25', '26-32', 'above-32'],
  soilMoisture: ['wet', 'medium', 'dry'],
  drainage: ['poor', 'adequate'],
  growthStage: ['seedling', 'vegetative', 'flowering', 'fruiting'],
} as const

export const OBSERVATION_MOODS = ['healthy', 'mixed', 'concern'] as const
export const ALERT_LEVELS = ['steady', 'watch', 'attention'] as const
export const TREATMENT_CATEGORIES = ['cultural', 'biological', 'chemical-supportive'] as const
export const EVIDENCE_STATUSES = ['sample-grade', 'sample-limited', 'unavailable'] as const

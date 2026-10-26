import type { SymptomOption } from '../types'

// ---------------------------------------------------------------------------
// Crops — starter catalogue
// ---------------------------------------------------------------------------

export interface CropDef {
  id: string
  name: string
  varieties: string[]
  season: string
}

export const CROPS: CropDef[] = [
  { id: 'tomato', name: 'Tomato', varieties: ['Arka Rakshak', 'Abhinav', 'Local line'], season: 'Kharif / Rabi' },
  { id: 'maize', name: 'Maize', varieties: ['Local composite', 'DKC hybrid', 'SC-717'], season: 'Kharif / Rabi' },
  { id: 'wheat', name: 'Wheat', varieties: ['HD-2967', 'Lok-1', 'Local line'], season: 'Rabi' },
  { id: 'potato', name: 'Potato', varieties: ['Kufri Jyoti', 'Lady Rosetta', 'Local line'], season: 'Rabi' },
  { id: 'rice', name: 'Rice', varieties: ['BPT-5204', 'Sona Masuri', 'Local line'], season: 'Kharif' },
  { id: 'cotton', name: 'Cotton', varieties: ['Bt hybrid', 'Local line'], season: 'Kharif' },
]

export function cropName(id: string): string {
  return CROPS.find((c) => c.id === id)?.name ?? id
}

export function defaultCrop(): CropDef {
  return CROPS[0]
}

// ---------------------------------------------------------------------------
// Symptoms — grouped observation chips
// ---------------------------------------------------------------------------

export const SYMPTOM_GROUPS: { key: string; label: string; symptoms: SymptomOption[] }[] = [
  {
    key: 'leaf',
    label: 'On the leaves',
    symptoms: [
      { id: 'leaf-brown-spots', label: 'Dark brown spots or lesions', category: 'leaf' },
      { id: 'leaf-yellowing', label: 'Yellowing leaves or edges', category: 'leaf' },
      { id: 'leaf-powdery', label: 'White powdery coating', category: 'leaf' },
      { id: 'leaf-rust', label: 'Orange / brown rust pustules', category: 'leaf' },
      { id: 'leaf-watersoaked', label: 'Water-soaked greasy patches', category: 'leaf' },
      { id: 'leaf-curl', label: 'Curling or crumpled leaves', category: 'leaf' },
      { id: 'leaf-tip-burn', label: 'Dried or burnt leaf tips', category: 'leaf' },
    ],
  },
  {
    key: 'plant',
    label: 'On the whole plant',
    symptoms: [
      { id: 'plant-wilting', label: 'Drooping or wilting', category: 'plant' },
      { id: 'plant-stunted', label: 'Stunted, slow growth', category: 'plant' },
      { id: 'plant-lesion-stem', label: 'Stem lesions or streaks', category: 'plant' },
      { id: 'plant-lodging', label: 'Lodging (falls over)', category: 'plant' },
    ],
  },
  {
    key: 'fruit-or-head',
    label: 'On fruit, grain or ear head',
    symptoms: [
      { id: 'fruit-rot', label: 'Rotting fruit or grain', category: 'fruit-or-head' },
      { id: 'fruit-spots', label: 'Spots or scarring on fruit', category: 'fruit-or-head' },
      { id: 'ear-smut', label: 'Black smut in ear heads', category: 'fruit-or-head' },
    ],
  },
]

export const ALL_SYMPTOMS: SymptomOption[] = SYMPTOM_GROUPS.flatMap((g) => g.symptoms)

export function symptomLabel(id: string): string {
  return ALL_SYMPTOMS.find((s) => s.id === id)?.label ?? id
}

// ---------------------------------------------------------------------------
// Environment factor options
// ---------------------------------------------------------------------------

export const ENVIRONMENT_OPTIONS = {
  humidity: [
    { value: 'high', label: 'High / cloudy' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low / dry' },
  ],
  recentRainfall: [
    { value: 'heavy', label: 'Heavy rain recently' },
    { value: 'moderate', label: 'Some rain' },
    { value: 'low', label: 'Little or no rain' },
  ],
  temperatureBand: [
    { value: '15-25', label: '15–25 °C (cool)' },
    { value: '26-32', label: '26–32 °C (warm)' },
    { value: 'above-32', label: 'Above 32 °C (hot)' },
  ],
  soilMoisture: [
    { value: 'wet', label: 'Wet / waterlogged' },
    { value: 'medium', label: 'Medium' },
    { value: 'dry', label: 'Dry' },
  ],
  drainage: [
    { value: 'poor', label: 'Poor drainage' },
    { value: 'adequate', label: 'Adequate' },
  ],
  growthStage: [
    { value: 'seedling', label: 'Seedling' },
    { value: 'vegetative', label: 'Vegetative' },
    { value: 'flowering', label: 'Flowering' },
    { value: 'fruiting', label: 'Fruiting / grain filling' },
  ],
} as const

// ---------------------------------------------------------------------------
// Community regions — deliberately district-shaped starter regions so
// no real-world outbreak claims can attach to them.
// ---------------------------------------------------------------------------

export interface RegionDef {
  id: string
  name: string
  tone: string
  hint: string
}

export const REGIONS: RegionDef[] = [
  { id: 'north', name: 'North District', tone: '#267A56', hint: 'Mixed tomato & maize belt' },
  { id: 'valley', name: 'Central Valley', tone: '#2F8C64', hint: 'Vegetable with wheat' },
  { id: 'plains', name: 'East Plains', tone: '#57A773', hint: 'Maize & cotton' },
  { id: 'river', name: 'River Belt', tone: '#8FB98D', hint: 'Rice with potato plots' },
  { id: 'high', name: 'Highland Zone', tone: '#A9C8A8', hint: 'Potato highlands' },
]

export function regionName(id: string): string {
  return REGIONS.find((r) => r.id === id)?.name ?? id
}

export const SYMPTOM_FILTERS = [
  { id: 'leaf-brown-spots', label: 'Dark spots / lesions' },
  { id: 'leaf-yellowing', label: 'Yellowing' },
  { id: 'leaf-powdery', label: 'Powdery coating' },
  { id: 'leaf-rust', label: 'Rust pustules' },
  { id: 'leaf-watersoaked', label: 'Water-soaked patches' },
  { id: 'plant-wilting', label: 'Wilting' },
]

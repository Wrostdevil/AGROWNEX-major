/** Small shared display helpers used by routes (crop display names etc.). */

export const CROP_NAMES: Record<string, string> = {
  tomato: 'Tomato',
  maize: 'Maize',
  wheat: 'Wheat',
  potato: 'Potato',
  rice: 'Rice',
  cotton: 'Cotton',
}

export const REGION_NAMES: Record<string, string> = {
  north: 'North District',
  valley: 'Central Valley',
  plains: 'East Plains',
  river: 'River Belt',
  high: 'Highland Zone',
}

export function conditionNameOf(cropId: string): string {
  return CROP_NAMES[cropId] ?? cropId
}

/** Condition marker meaning "generally applicable across leaf-disease patterns". */
export const APPLICABLE_TO_ALL_CONDITIONS = 'general-applicability'

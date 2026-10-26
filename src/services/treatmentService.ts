import type { TreatmentOption, Preferences } from '../types'
import { rankTreatments, TREATMENTS, type RankedTreatment } from '../data/treatments'
import { CONDITIONS, conditionById, type HealthPattern } from '../data/conditions'
import { delay } from './storage'
import { saveComparison } from './savedComparisons'

/**
 * treatmentService — cost-aware planner with local persistence.
 *
 * Ranking itself is deterministic (see data/treatments.ts). Later this wraps a
 * FastAPI call to the verified-formulation catalogue + ranking engine.
 */

export function conditionsForPlanner(_cropId: string | null): HealthPattern[] {
  // Flat unique list across all crops (cotton included).
  const seen = new Set<string>()
  const list: HealthPattern[] = []
  for (const c of CONDITIONS) {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      list.push(c)
    }
  }
  return list
}

export function conditionMeta(id: string): HealthPattern | undefined {
  return conditionById(id)
}

export function planTreatments(
  conditionId: string,
  budget: number,
): { ranked: RankedTreatment[]; options: TreatmentOption[] } {
  const meta = conditionMeta(conditionId)
  const ids = meta?.treatmentIds ?? ['scout-followup', 'watering-tune', 'balanced-fertilization']
  const options = ids.map((id) => TREATMENTS.find((t) => t.id === id)).filter((t): t is TreatmentOption => Boolean(t))
  const ranked = rankTreatments(options, conditionId, budget)
  return { ranked, options }
}

export function simulatePlanLatency<T>(value: T): Promise<T> {
  return delay(value, 380)
}

export function persistSavedComparison(
  prefsUnits: Preferences['units'],
  conditionId: string,
  budget: number,
  picked: string[],
) {
  void prefsUnits
  saveComparison(`${conditionId} @ ${budget}/acre · ${picked.length} options`)
}

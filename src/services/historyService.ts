import type { AnalysisHistoryRecord } from '../types'
import { STORAGE_KEYS, Store, useStoreValue } from './storage'
import { tsDaysAgo } from '../utils'

function seedRecords(): AnalysisHistoryRecord[] {
  return [
    {
      id: 'hx_sample_1',
      createdAt: tsDaysAgo(2, 3),
      cropId: 'tomato',
      cropName: 'Tomato',
      label: 'North Block · plot rows 1–14',
      conditionId: 'tomato-early-blight',
      conditionName: 'Early blight pattern',
      confidence: 0.74,
      risk: 'moderate',
      status: 'complete',
      source: 'sample',
    },
    {
      id: 'hx_sample_2',
      createdAt: tsDaysAgo(5, 6),
      cropId: 'maize',
      cropName: 'Maize',
      label: 'River-side plot',
      conditionId: 'maize-nclb',
      conditionName: 'Large-leaf-blight pattern',
      confidence: 0.68,
      risk: 'elevated',
      status: 'complete',
      source: 'sample',
    },
    {
      id: 'hx_sample_3',
      createdAt: tsDaysAgo(9, 2),
      cropId: 'rice',
      cropName: 'Rice',
      label: 'Terrace-2 paddy',
      conditionId: 'rice-leaf-yellowing',
      conditionName: 'Nutrient-stress pattern',
      confidence: 0.52,
      risk: 'moderate',
      status: 'incomplete',
      source: 'sample',
    },
  ]
}

export const historyStore = new Store<AnalysisHistoryRecord[]>(STORAGE_KEYS.history, seedRecords)

export function useHistory(): AnalysisHistoryRecord[] {
  return useStoreValue(historyStore)
}

export function addHistory(record: AnalysisHistoryRecord) {
  historyStore.update((prev) => [record, ...prev].slice(0, 60))
}

export function removeHistory(id: string) {
  historyStore.update((prev) => prev.filter((r) => r.id !== id))
}

export function getHistoryRecord(id: string | null): AnalysisHistoryRecord | undefined {
  return historyStore.read().find((r) => r.id === id)
}

export function latestCompleteRecord(): AnalysisHistoryRecord | undefined {
  return historyStore.read().find((r) => r.status === 'complete')
}

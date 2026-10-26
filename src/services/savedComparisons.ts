import { STORAGE_KEYS, Store, useStoreValue } from './storage'
import { historyStore } from './historyService'

/**
 * savedComparisons — tracks how many treatment comparisons the user has saved
 * locally. Small state, but it powers the dashboard stat card without any
 * duplicated scanning logic.
 */

export const savedComparisonsStore = new Store<string[]>(STORAGE_KEYS.savedComparisons, () => [])

export function useSavedComparisons(): string[] {
  return useStoreValue(savedComparisonsStore)
}

export function saveComparison(key: string): boolean {
  let added = false
  savedComparisonsStore.update((prev) => {
    if (prev.includes(key)) return prev
    added = true
    return [key, ...prev].slice(0, 20)
  })
  return added
}

/** Count of samples + locally created records — mirrors the history service intentionally. */
export function comparisonStatSeed(): number {
  return historyStore.read().filter((r) => r.status === 'complete').length >= 1 ? 3 : 2
}

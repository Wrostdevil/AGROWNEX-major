import { useSyncExternalStore } from 'react'

/**
 * Tiny observable + localStorage-persisted store.
 *
 * Local services are built on these. Later, the same interface can be satisfied
 * by HTTP-backed services without touching presentation components.
 */
export class Store<T> {
  private listeners = new Set<() => void>()
  private cache: T | null = null

  constructor(
    private readonly key: string,
    private readonly init: () => T,
  ) {}

  read(): T {
    if (this.cache === null) {
      try {
        const raw = localStorage.getItem(this.key)
        this.cache = raw ? (JSON.parse(raw) as T) : this.init()
      } catch {
        this.cache = this.init()
      }
    }
    return this.cache
  }

  write(value: T) {
    this.cache = value
    try {
      localStorage.setItem(this.key, JSON.stringify(value))
    } catch {
      // Storage full / unavailable — state simply stays in memory.
    }
    this.emit()
  }

  update(fn: (prev: T) => T) {
    this.write(fn(this.read()))
  }

  reset() {
    try {
      localStorage.removeItem(this.key)
    } catch {
      // ignore
    }
    this.cache = null
    this.emit()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit() {
    for (const l of [...this.listeners]) l()
  }
}

/** Subscribe React components to a Store. */
export function useStoreValue<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, () => store.read(), () => store.read())
}

export function updateStore<T>(store: Store<T>, fn: (prev: T) => T) {
  store.update(fn)
}

/** Async delay helper for local services (deterministic timing, testable). */
export function delay<T>(value: T, ms = 420): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export const STORAGE_KEYS = {
  prefs: 'agrownex.prefs.v1',
  history: 'agrownex.history.v1',
  notifications: 'agrownex.notifications.v1',
  fields: 'agrownex.fields.v1',
  reports: 'agrownex.community.reports.v1',
  savedComparisons: 'agrownex.treatment.saved.v1',
} as const

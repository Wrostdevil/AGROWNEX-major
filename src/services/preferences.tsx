import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import type { Preferences } from '../types'
import { STORAGE_KEYS, Store, useStoreValue } from './storage'
import { tsDaysAgo } from '../utils'

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  reducedMotion: false,
  language: 'en',
  units: 'metric',
  areaUnit: 'acre',
  notifyCommunity: true,
  notifyAnalysis: true,
  notifyReminders: true,
  defaultRegionId: 'north',
  profileName: '',
  onboardedAt: null,
}

export const preferencesStore = new Store<Preferences>(STORAGE_KEYS.prefs, () => DEFAULT_PREFERENCES)

export function usePreferences(): Preferences {
  const prefs = useStoreValue(preferencesStore)
  return { ...DEFAULT_PREFERENCES, ...prefs }
}

/** Display name for the profile area — falls back gracefully when unset. */
export function displayName(prefs: Preferences): string {
  const name = prefs.profileName?.trim()
  return name ? name : 'Guest grower'
}

/** Two-letter initials for avatar chips. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AG'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function updatePreferences(patch: Partial<Preferences>) {
  preferencesStore.update((prev) => ({ ...DEFAULT_PREFERENCES, ...prev, ...patch }))
}

export const LANGUAGE_OPTIONS: { id: Preferences['language']; label: string; status: 'available' | 'planned' }[] = [
  { id: 'en', label: 'English', status: 'available' },
  { id: 'hi', label: 'हिन्दी (Hindi)', status: 'planned' },
  { id: 'te', label: 'తెలుగు (Telugu)', status: 'planned' },
  { id: 'mr', label: 'मराठी (Marathi)', status: 'planned' },
]

void tsDaysAgo

/** Applies theme + motion preferences globally. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const prefs = usePreferences()

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', prefs.theme === 'dark')
  }, [prefs.theme])

  return (
    <MotionConfig reducedMotion={prefs.reducedMotion ? 'always' : 'user'}>
      {children}
    </MotionConfig>
  )
}

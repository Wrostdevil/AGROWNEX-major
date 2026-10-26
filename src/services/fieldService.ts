import type { FieldProfile, CropObservation } from '../types'
import { STORAGE_KEYS, Store, useStoreValue, delay } from './storage'
import { isoDaysAgo, uid } from '../utils'

/**
 * fieldService — field & crop profiles with local persistence.
 * Local state only; no GPS or precise location is collected.
 */

function seedFields(): FieldProfile[] {
  return [
    {
      id: 'fd_sample_1',
      name: 'North Block',
      cropId: 'tomato',
      variety: 'Arka Rakshak',
      areaValue: 1.2,
      areaUnit: 'acre',
      plantedOn: isoDaysAgo(64),
      notes: 'Support rows west side were replanted after a weak germination patch.',
      soil: 'Sandy loam',
      irrigation: 'Drip, alternate days',
      observations: [
        { id: 'ob1', observedOn: isoDaysAgo(28), note: 'Uniform canopy; lower leaves clean.', mood: 'healthy' },
        { id: 'ob2', observedOn: isoDaysAgo(12), note: 'Few ringish brown spots on lower rows, scattered.', mood: 'mixed' },
        { id: 'ob3', observedOn: isoDaysAgo(4), note: 'Spotting stable, not spreading fast; keep watching.', mood: 'concern' },
      ],
      createdAt: Date.now() - 90 * 86_400_000,
    },
    {
      id: 'fd_sample_2',
      name: 'River-side plot',
      cropId: 'maize',
      variety: 'SC-717',
      areaValue: 0.8,
      areaUnit: 'acre',
      plantedOn: isoDaysAgo(58),
      soil: 'Alluvial',
      irrigation: 'Rainfed',
      observations: [
        { id: 'ob4', observedOn: isoDaysAgo(9), note: 'Long lesions on a handful of plants near the bund.', mood: 'concern' },
      ],
      createdAt: Date.now() - 80 * 86_400_000,
    },
    {
      id: 'fd_sample_3',
      name: 'Highland ridge',
      cropId: 'potato',
      areaValue: 2,
      areaUnit: 'acre',
      plantedOn: isoDaysAgo(47),
      notes: 'Third consecutive potato season on this ridge.',
      observations: [],
      createdAt: Date.now() - 75 * 86_400_000,
    },
  ]
}

export const fieldsStore = new Store<FieldProfile[]>(STORAGE_KEYS.fields, seedFields)

export function useFields(): FieldProfile[] {
  return useStoreValue(fieldsStore)
}

export function addField(input: Omit<FieldProfile, 'id' | 'createdAt' | 'observations'>): FieldProfile {
  const field: FieldProfile = { ...input, id: uid('fd'), createdAt: Date.now(), observations: [] }
  fieldsStore.update((prev) => [...prev, field])
  return field
}

export function updateField(id: string, patch: Partial<FieldProfile>) {
  fieldsStore.update((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
}

export function removeField(id: string) {
  fieldsStore.update((prev) => prev.filter((f) => f.id !== id))
}

export function addObservation(fieldId: string, input: { observedOn: string; note: string; mood: CropObservation['mood'] }) {
  const obs: CropObservation = { id: uid('ob'), observedOn: input.observedOn, note: input.note, mood: input.mood }
  fieldsStore.update((prev) =>
    prev.map((f) => (f.id === fieldId ? { ...f, observations: [obs, ...f.observations] } : f)),
  )
  return obs
}

export function fieldsFakeLatency<T>(value: T): Promise<T> {
  return delay(value, 350)
}

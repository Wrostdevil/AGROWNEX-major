import type { CommunityAlert, CommunityReport, CommunityWeeklyPoint } from '../types'
import { getSeries, listSampleAlerts, weekLabels } from '../data/community'
import { SYMPTOM_FILTERS } from '../data/catalog'
import { STORAGE_KEYS, Store, useStoreValue } from './storage'
import { createCommunityReport as apiCreateReport } from './api/endpoints'
import { isApiError } from './api/apiClient'
import { uid, isoDaysAgo, todayISO } from '../utils'

/**
 * communityService — community early-warning workspace.
 *
 * Server-side aggregation will live behind the same interface later. Reports
 * are stored locally and merged into the deterministic series so the
 * charts visibly respond to a submitted observation.
 */

function seedReports(): CommunityReport[] {
  return [
    {
      id: 'cr_sample_1',
      createdAt: Date.now() - 5 * 86_400_000,
      regionId: 'north',
      cropId: 'tomato',
      symptomId: 'leaf-brown-spots',
      observedOn: isoDaysAgo(5),
      notes: 'Starter report: lower leaves on two rows showing ringed spots.',
      sample: true,
    },
    {
      id: 'cr_sample_2',
      createdAt: Date.now() - 2 * 86_400_000,
      regionId: 'river',
      cropId: 'rice',
      symptomId: 'leaf-yellowing',
      observedOn: isoDaysAgo(2),
      notes: 'Starter report: patchy yellowing near the field canal turn.',
      sample: true,
    },
    {
      id: 'cr_sample_3',
      createdAt: Date.now() - 1 * 86_400_000,
      regionId: 'high',
      cropId: 'potato',
      symptomId: 'leaf-powdery',
      observedOn: isoDaysAgo(1),
      notes: 'Starter report: light white dusting on a few ridge plants.',
      sample: true,
    },
  ]
}

export const reportsStore = new Store<CommunityReport[]>(STORAGE_KEYS.reports, seedReports)

export function useCommunityReports(): CommunityReport[] {
  return useStoreValue(reportsStore)
}

export async function submitReport(input: {
  regionId: string
  cropId: string
  symptomId: string
  observedOn: string
  notes?: string
}): Promise<CommunityReport> {
  const report: CommunityReport = {
    id: uid('cr'),
    createdAt: Date.now(),
    regionId: input.regionId,
    cropId: input.cropId,
    symptomId: input.symptomId,
    observedOn: input.observedOn || todayISO(),
    notes: input.notes,
    sample: false,
  }
  reportsStore.update((prev) => [report, ...prev].slice(0, 120))

  // Try to persist through the Express API; on failure stay in the local store
  // with a console notice (the UI surfaces fallback banners on API errors).
  try {
    const stored = await apiCreateReport({
      regionId: input.regionId,
      cropId: input.cropId,
      symptomId: input.symptomId,
      observedOn: report.observedOn,
      notes: report.notes,
    })
    report.id = stored.id // authoritative backend id — later deletion maps cleanly
    report.sample = false
  } catch (err) {
    console.warn(
      '[community] backend persistence unavailable — kept in local store:',
      isApiError(err) ? `${err.status} ${err.code}` : err,
    )
  }
  return report
}

/** Series for the trend chart — deterministic base + locally-submitted reports merged in. */
export function mergedSeries(regionId: string, cropId: string, symptomId: string): CommunityWeeklyPoint[] {
  const base = getSeries(regionId, cropId, symptomId)
  const reports = reportsStore.read()
  if (reports.length === 0) return base

  const labels = base.map((p) => p.label)
  const currentWeekLabel = labels[labels.length - 1]
  const out = [...base]
  // Very coarse mapping: a submitted report nudges either "this week" or
  // the second-to-last week depending on the observed date.
  for (const r of reports) {
    if (r.regionId !== regionId || r.cropId !== cropId || r.symptomId !== symptomId) continue
    const daysOld = Math.max(0, Math.round((Date.now() - new Date(r.observedOn + 'T00:00:00').getTime()) / 86_400_000))
    const idx = daysOld <= 7 ? out.length - 1 : out.length - 2
    const target = out[idx]
    if (target && typeof target.count === 'number') {
      out[idx] = { ...target, label: target.label || currentWeekLabel, count: target.count + 1 }
    }
  }
  return out
}

export function sampleAlertsWithReports(regionId?: string, cropId?: string): CommunityAlert[] {
  return listSampleAlerts(regionId, cropId)
}

export function filterOptions() {
  return SYMPTOM_FILTERS
}

export function weekLabelList(n: number) {
  return weekLabels(n)
}

export const DATA_QUALITY_NOTE =
  'Starter dataset — report counts are seeded example data for this workspace. They are intended to demonstrate trend logic and alert thresholds, not the state of any real area.'

import type { CommunityAlert, CommunityRegion, CommunityWeeklyPoint, AlertLevel } from '../types'
import { cropName, REGIONS, SYMPTOM_FILTERS } from './catalog'
import { regionName } from './catalog'

// ---------------------------------------------------------------------------
// Deterministic weekly report series.
//
// "Reports" here are seeded community observations from the starter dataset.
// used throughout so no claim can ever attach to real districts. The generator
// is seeded: the same (region, crop, symptom) always renders the same series,
// which keeps charts, alerts and assistant answers mutually consistent.
// ---------------------------------------------------------------------------

export function listRegions(): CommunityRegion[] {
  return REGIONS
}

function hash2(a: number, b: number): number {
  // Small deterministic 2-input hash → [0,1)
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return x - Math.floor(x)
}

interface ComboConfig {
  base: number
  drift: number // per-week drift (can be negative)
  recentBoost: number // multiplier for the last 4 weeks
}

function comboConfig(regionId: string, cropId: string, symptomId: string): ComboConfig {
  // The flagship trend: North District · Tomato · dark spots — a clearly
  // separated increase that powers the "watch alert" narrative. Everything
  // else stays comparatively quiet.
  if (regionId === 'north' && cropId === 'tomato' && symptomId === 'leaf-brown-spots') {
    return { base: 9, drift: 0.5, recentBoost: 1.9 }
  }
  if (regionId === 'north' && cropId === 'tomato' && symptomId === 'leaf-yellowing') {
    return { base: 5, drift: 0.25, recentBoost: 1.5 }
  }
  if (regionId === 'river' && cropId === 'rice' && symptomId === 'leaf-yellowing') {
    return { base: 5, drift: 0.15, recentBoost: 1.3 }
  }
  if (regionId === 'river' && symptomId === 'leaf-watersoaked' && cropId === 'potato') {
    return { base: 4, drift: 0.15, recentBoost: 1.25 }
  }
  if (regionId === 'high' && cropId === 'potato' && symptomId === 'leaf-powdery') {
    return { base: 3, drift: 0.1, recentBoost: 1.2 }
  }
  const idx =
    REGIONS.findIndex((r) => r.id === regionId) * 10 +
    SYMPTOM_FILTERS.findIndex((s) => s.id === symptomId) * 3 +
    cropId.length
  return { base: 1 + Math.round((idx % 4) * 1.4), drift: 0, recentBoost: 1 }
}

export function weekLabels(n: number): string[] {
  const labels: string[] = []
  for (let i = n - 1; i >= 1; i--) labels.push(`W−${i}`)
  labels.push('This wk')
  return labels
}

export function getSeries(regionId: string, cropId: string, symptomId: string, weeks = 12): CommunityWeeklyPoint[] {
  const cfg = comboConfig(regionId, cropId, symptomId)
  const labels = weekLabels(weeks)
  const points: CommunityWeeklyPoint[] = []
  for (let i = 0; i < weeks; i++) {
    const noise = hash2(i + 1, regionId.length * 97 + cropId.length * 13 + symptomId.length * 7) - 0.5
    const recent = i >= weeks - 4 ? cfg.recentBoost : 1
    const value = Math.max(0, Math.round((cfg.base + cfg.drift * i) * recent + noise * cfg.base * 0.5))
    points.push({ week: i, label: labels[i], count: value })
  }
  return points
}

// ---------------------------------------------------------------------------
// Watch alerts — computed from the same series shown in the charts, so the
// alert logic and visual data never disagree.
// ---------------------------------------------------------------------------

const ALERT_WIN_SIZE = 4

export function alertLevelForSeries(series: CommunityWeeklyPoint[]): { level: AlertLevel; ratio: number } {
  const recent = series.slice(-ALERT_WIN_SIZE).reduce((s, p) => s + p.count, 0)
  const prior = series.slice(0, -ALERT_WIN_SIZE).reduce((s, p) => s + p.count, 0)
  const recentMean = recent / ALERT_WIN_SIZE
  const priorMean = prior / Math.max(1, series.length - ALERT_WIN_SIZE)
  const ratio = priorMean > 0 ? recentMean / priorMean : recentMean > 0 ? 2 : 1
  // Absolute floors keep tiny-count noise combos out of the alert list.
  const level: AlertLevel =
    recentMean >= 10 && ratio >= 1.6
      ? 'attention'
      : recentMean >= 5 && ratio >= 1.22
        ? 'watch'
        : 'steady'
  return { level, ratio }
}

export function computeAlert(regionId: string, cropId: string, symptomId: string): CommunityAlert {
  const series = getSeries(regionId, cropId, symptomId)
  const { level, ratio } = alertLevelForSeries(series)
  const recent = series.slice(-4).reduce((s, p) => s + p.count, 0)
  const prior = series.slice(0, -4).reduce((s, p) => s + p.count, 0)
  const symptomLabel = SYMPTOM_FILTERS.find((s) => s.id === symptomId)?.label ?? symptomId
  const crop = cropName(cropId)
  const region = regionName(regionId)

  const trendSummary =
    level === 'steady'
      ? `Report counts for ${crop} / ${symptomLabel} in ${region} are broadly steady over the last four weeks.`
      : `Report counts for ${crop} / ${symptomLabel} in ${region} have been trending upward over the last four weeks (~${Math.round((ratio - 1) * 100)}% above the earlier period).`

  return {
    id: `${regionId}:${cropId}:${symptomId}`,
    regionId,
    cropId,
    symptomId,
    level,
    windowLabel: 'Last 4 weeks vs prior 8 weeks',
    reportCounts: { recent, prior },
    trendSummary,
    uncertaintyNote:
      'A rise in reports suggests increased observation activity — it is not a confirmed outbreak. Verification continues at the community level.',
    computedAt: Date.now(),
  }
}

export function listSampleAlerts(regionId?: string, cropId?: string): CommunityAlert[] {
  const regions = regionId ? [regionId] : listRegions().map((r) => r.id)
  const crops = cropId ? [cropId] : ['tomato', 'maize', 'potato', 'rice']
  const alerts: CommunityAlert[] = []
  for (const r of regions) {
    for (const c of crops) {
      for (const s of SYMPTOM_FILTERS) {
        const alert = computeAlert(r, c, s.id)
        if (alert.level !== 'steady') alerts.push(alert)
      }
    }
  }
  return alerts
    .sort((a, b) => levelRank(b.level) - levelRank(a.level) || b.reportCounts.recent - a.reportCounts.recent)
    .slice(0, 6)
}

function levelRank(level: AlertLevel): number {
  return level === 'attention' ? 2 : level === 'watch' ? 1 : 0
}

/**
 * Community early-warning engine — pure functions for the documented baseline
 * rule (§11 of the research plan), fully unit-testable without a database.
 *
 * Rule: compare a recent observation window against the prior window of the
 * same length. A "watch" needs modest relative elevation with a minimum floor;
 * "attention" needs larger elevation with the floor. Elevated reporting is
 * never called an outbreak — the ouput wording stays "potential increase in
 * reported symptoms".
 */

import { env } from '../config/env.js'

export interface WeeklyPoint {
  label: string
  count: number
}

export interface TrendThresholds {
  attentionRatio: number
  watchRatio: number
  attentionMin: number
  watchMin: number
}

export interface CoreTrend {
  recentCount: number
  priorCount: number
  ratio: number | null
  level: 'steady' | 'watch' | 'attention'
  trendSummary: string
  uncertaintyNote: string
  windowLabel: string
}

export const DEFAULT_THRESHOLDS: TrendThresholds = {
  attentionRatio: env.ALERT_ATTENTION_RATIO,
  watchRatio: env.ALERT_WATCH_RATIO,
  attentionMin: env.ALERT_ATTENTION_FLOOR,
  watchMin: env.ALERT_WATCH_FLOOR,
}

/** Same documented rule values, exposed for route code that prefers a function call. */
export function levelThresholds(): TrendThresholds {
  const t = DEFAULT_THRESHOLDS
  return { attentionRatio: t.attentionRatio, watchRatio: t.watchRatio, attentionMin: t.attentionMin, watchMin: t.watchMin }
}

export function isoWeeksBack(days: number): Date {
  return new Date(Date.now() - days * 86_400_000)
}

const ATTENTION_NOTE =
  'This marker reflects report counts from a small volunteer-style demo population — it is a potential increase in reported symptoms, not a confirmed outbreak. Follow local agricultural advisory channels for official guidance.'
const WATCH_NOTE =
  'Elevation is modest and the population is small. Keep observing and resubmit if more plots show the same signs; this is not a confirmed outbreak.'

/** Compute the level for one series (reported counts per period). */
export function computeLevel(
  recent: number,
  prior: number,
  t: TrendThresholds,
): { level: 'steady' | 'watch' | 'attention'; ratio: number | null } {
  if (recent === 0 && prior === 0) return { level: 'steady', ratio: null }
  if (prior === 0) {
    // No baseline — only reach watch with enough volume.
    return { level: recent >= t.watchMin ? 'watch' : 'steady', ratio: null }
  }
  const ratio = recent / prior
  if (ratio >= t.attentionRatio && recent >= t.attentionMin) return { level: 'attention', ratio }
  if (ratio >= t.watchRatio && recent >= t.watchMin) return { level: 'watch', ratio }
  return { level: 'steady', ratio }
}

export function coreTrend(recent: number, prior: number, t: TrendThresholds, windowLabel: string): CoreTrend {
  const { level, ratio } = computeLevel(recent, prior, t)
  const trendSummary =
    level === 'attention'
      ? `Potential increase in reported symptoms: ${recent} reports recently vs ${prior} in the previous window (${ratio ? ratio.toFixed(2) : 'n/a'}× baseline sample).`
      : level === 'watch'
        ? `Reports are moving above baseline sample: ${recent} recent vs ${prior} previous (${ratio ? ratio.toFixed(2) : 'n/a'}×).`
        : `No marked change in reported symptoms: ${recent} recent vs ${prior} previous.`
  return {
    recentCount: recent,
    priorCount: prior,
    ratio,
    level,
    trendSummary,
    uncertaintyNote: level === 'attention' ? ATTENTION_NOTE : WATCH_NOTE,
    windowLabel,
  }
}

/** Split ISO-date strings into recent/prior windows of `windowDays`. */
export function splitWindows(dates: string[], windowDays: number, now = Date.now()): { recent: number; prior: number } {
  const recentStart = now - windowDays * 86_400_000
  const priorStart = now - windowDays * 2 * 86_400_000
  let recent = 0
  let prior = 0
  for (const d of dates) {
    const ts = new Date(d + 'T00:00:00Z').getTime()
    if (Number.isNaN(ts)) continue
    if (ts >= recentStart) recent++
    else if (ts >= priorStart) prior++
  }
  return { recent, prior }
}

export interface AggregateKey {
  regionId: string
  cropId: string
  symptomId: string
}

/** Group report records (date + key) so trends can be computed per series. */
export function aggregateBySeries<T extends { regionId: string; cropId: string; symptomId: string; observedOn: string }>(
  reports: T[],
): Array<AggregateKey & { dates: string[] }> {
  const map = new Map<string, AggregateKey & { dates: string[] }>()
  for (const r of reports) {
    const key = `${r.regionId}|${r.cropId}|${r.symptomId}`
    let entry = map.get(key)
    if (!entry) {
      entry = { regionId: r.regionId, cropId: r.cropId, symptomId: r.symptomId, dates: [] }
      map.set(key, entry)
    }
    entry.dates.push(r.observedOn)
  }
  return [...map.values()]
}


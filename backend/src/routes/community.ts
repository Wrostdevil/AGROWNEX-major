import { Router } from 'express'
import { communityReportCreateSchema } from '../validators/schemas.js'
import { CommunityReport, CommunityAlert, AuditEvent } from '../models/index.js'
import { requireDb } from '../config/db.js'
import { ApiErrorNotFound } from '../middleware/errors.js'
import { ah } from '../middleware/async.js'
import { aggregateBySeries, coreTrend, splitWindows, levelThresholds, DEFAULT_THRESHOLDS } from '../services/communityTrends.js'
import { REGION_NAMES, CROP_NAMES } from './catalog-shared.js'
import { SYMPTOM_LABELS } from '../domain/symptomLabels.js'

export const communityRouter = Router()

/**
 * Community monitoring (§11): reports persist in MongoDB; trends and alerts
 * are computed with the documented threshold rule. Wording stays at "potential
 * increase in reported symptoms" — alerts are never called outbreaks.
 */

const WINDOW_DAYS = 14

interface ReportQuery {
  regionId?: string
  cropId?: string
  symptomId?: string
  from?: string
  to?: string
}

function reportFilter(query: ReportQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  for (const key of ['regionId', 'cropId', 'symptomId'] as const) {
    const v = query[key]
    if (typeof v === 'string' && v) filter[key] = v
  }
  const dateFilter: Record<string, string> = {}
  if (typeof query.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.from)) dateFilter.$gte = query.from
  if (typeof query.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) dateFilter.$lte = query.to
  if (Object.keys(dateFilter).length > 0) filter.observedOn = dateFilter
  return filter
}

function seriesLabel(r: { regionId: string; cropId: string; symptomId: string }): string {
  return `${REGION_NAMES[r.regionId] ?? r.regionId} · ${CROP_NAMES[r.cropId] ?? r.cropId} · ${SYMPTOM_LABELS[r.symptomId] ?? r.symptomId}`
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

communityRouter.get('/reports', ah(async (req, res) => {
  requireDb()
  const limit = Math.min(Number(req.query.limit ?? 50), 200)
  const skip = Math.max(Number(req.query.skip ?? 0), 0)
  const filter = reportFilter(req.query as ReportQuery)
  const [items, total] = await Promise.all([
    CommunityReport.find(filter).sort({ observedOn: -1 }).limit(limit).skip(skip).lean(),
    CommunityReport.countDocuments(filter),
  ])
  res.json({ items: items.map((d) => ({ ...d, id: String(d._id) })), total, notice: 'Coarse regions only; report-level identity of submitters is never published.' })
}))

communityRouter.post('/reports', ah(async (req, res) => {
  requireDb()
  const input = communityReportCreateSchema.parse(req.body ?? {})
  const doc = await CommunityReport.create(input)
  await AuditEvent.create({ event: 'community-report:created', detail: { reportId: String(doc._id), regionId: input.regionId } })
  res.status(201).json({ id: String(doc._id), ...input, notice: 'Report stored (coarse region only). It now feeds the aggregated trend view.' })
}))

communityRouter.delete('/reports/:id', ah(async (req, res) => {
  requireDb()
  const doc = await CommunityReport.findByIdAndDelete(req.params.id)
  if (!doc) throw new ApiErrorNotFound(`No report with id ${req.params.id}`)
  res.json({ deleted: String(doc._id) })
}))

// ---------------------------------------------------------------------------
// Trends + alerts
// ---------------------------------------------------------------------------

communityRouter.get('/trends', ah(async (req, res) => {
  requireDb()
  const filter = reportFilter(req.query as ReportQuery)
  const reports = (await CommunityReport.find(filter).sort({ observedOn: -1 }).limit(1000).lean()) as unknown as Array<{ regionId: string; cropId: string; symptomId: string; observedOn: string }>
  const series = aggregateBySeries(reports)
  const trends = series
    .map((s) => ({ series: s, ...splitWindows(s.dates, WINDOW_DAYS) }))
    .filter((e) => e.recent + e.prior > 0)
    .map((e) => ({
      regionId: e.series.regionId,
      regionName: REGION_NAMES[e.series.regionId] ?? e.series.regionId,
      cropId: e.series.cropId,
      cropName: CROP_NAMES[e.series.cropId] ?? e.series.cropId,
      symptomId: e.series.symptomId,
      symptomName: SYMPTOM_LABELS[e.series.symptomId] ?? e.series.symptomId,
      ...coreTrend(e.recent, e.prior, levelThresholds(), `last ${WINDOW_DAYS} days vs previous ${WINDOW_DAYS} days`),
    }))
    .sort((a, b) => ({ attention: 3, watch: 2, steady: 1 })[b.level] - ({ attention: 3, watch: 2, steady: 1 })[a.level])
    .slice(0, 20)

  // Weekly chart series across the selected window (per week buckets, last 8 weeks)
  const weekly = bucketWeekly(reports, 8)

  res.json({
    windowDays: WINDOW_DAYS,
    thresholds: DEFAULT_THRESHOLDS,
    trends,
    weekly,
    notice:
      'Trends come from a small sample population and reflect report counts only — potential increases, not confirmed outbreaks.',
  })
}))

communityRouter.get('/alerts', ah(async (_req, res) => {
  requireDb()
  const reports = (await CommunityReport.find().sort({ observedOn: -1 }).limit(1000).lean()) as unknown as Array<{ regionId: string; cropId: string; symptomId: string; observedOn: string }>
  const series = aggregateBySeries(reports)
  const computed = series
    .map((s) => ({ series: s, ...splitWindows(s.dates, WINDOW_DAYS) }))
    .filter((e) => e.recent + e.prior >= levelThresholds().watchMin)
    .map((e) => ({
      key: `${e.series.regionId}|${e.series.cropId}|${e.series.symptomId}`,
      ...coreTrend(e.recent, e.prior, levelThresholds(), `last ${WINDOW_DAYS} days vs previous ${WINDOW_DAYS} days`),
    }))
    .filter((t) => t.level !== 'steady')

  const now = new Date()
  interface StoredAlert {
    id: string
    regionId: string
    cropId: string
    symptomId: string
    level: string
    windowLabel: string
    reportCounts: { recent: number; prior: number }
    trendSummary: string
    uncertaintyNote: string
    computedAt: Date | string
  }
  const stored: StoredAlert[] = []
  for (const t of computed) {
    const [regionId, cropId, symptomId] = t.key.split('|')
    const existing = (await CommunityAlert.findOne({ regionId, cropId, symptomId, level: t.level }).sort({ computedAt: -1 }).lean()) as Record<string, unknown> | null
    if (existing) {
      stored.push({
        id: String(existing._id),
        regionId: String(existing.regionId),
        cropId: String(existing.cropId),
        symptomId: String(existing.symptomId),
        level: String(existing.level),
        windowLabel: String(existing.windowLabel),
        reportCounts: existing.reportCounts as { recent: number; prior: number },
        trendSummary: String(existing.trendSummary),
        uncertaintyNote: String(existing.uncertaintyNote),
        computedAt: existing.computedAt as Date,
      })
      continue
    }
    const created = await CommunityAlert.create({
      regionId, cropId, symptomId, level: t.level, windowLabel: t.windowLabel,
      reportCounts: { recent: t.recentCount, prior: t.priorCount },
      trendSummary: t.trendSummary, uncertaintyNote: t.uncertaintyNote, computedAt: now,
    })
    const plain = created.toObject()
    stored.push({
      id: String(created._id),
      regionId, cropId, symptomId,
      level: t.level,
      windowLabel: t.windowLabel,
      reportCounts: { recent: t.recentCount, prior: t.priorCount },
      trendSummary: t.trendSummary,
      uncertaintyNote: t.uncertaintyNote,
      computedAt: plain.computedAt as Date,
    })
  }

  const thresholds = levelThresholds()
  res.json({
    windowDays: WINDOW_DAYS,
    alerts: stored
      .map((a) => ({ ...a, label: seriesLabel(a) }))
      .sort((a, b) => String(b.computedAt).localeCompare(String(a.computedAt)))
      .slice(0, 20),
    rule: `Alert levels follow a documented rule: "attention" needs recent/prior ratio ≥ ${thresholds.attentionRatio} with recent reports ≥ ${thresholds.attentionMin}; "watch" needs ratio ≥ ${thresholds.watchRatio} with recent reports ≥ ${thresholds.watchMin}. Elevated reporting in a small demo population is never labelled a confirmed outbreak.`,
  })
}))

/** Bucket reports into weekly counts (Monday-anchored) for the frontend trend chart. */
function bucketWeekly(reports: Array<{ observedOn: string }>, weeks: number): Array<{ week: string; count: number }> {
  const buckets = new Map<string, number>()
  for (const r of reports) {
    const ts = Date.parse(`${r.observedOn}T00:00:00Z`)
    if (Number.isNaN(ts)) continue
    const monday = new Date(ts)
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-weeks)
    .map(([week, count]) => ({ week, count }))
}

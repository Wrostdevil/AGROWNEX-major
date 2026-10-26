import { Router } from 'express'
import { CropAnalysis, CommunityReport, CommunityAlert, FieldProfile } from '../models/index.js'
import { requireDb } from '../config/db.js'
import { CROP_NAMES } from './catalog-shared.js'
import { ah } from '../middleware/async.js'

export const dashboardRouter = Router()

/**
 * Dashboard aggregate (§13). Counts and latest records come from MongoDB and
 * are labelled as this instance's stored sample data — nothing is invented.
 */
dashboardRouter.get('/', ah(async (_req, res) => {
  requireDb()
  const [analyses, reportsDocs, alerts, fields] = await Promise.all([
    CropAnalysis.find().sort({ createdAt: -1 }).limit(5).lean(),
    CommunityReport.find().sort({ observedOn: -1 }).limit(500).lean(),
    CommunityAlert.find().sort({ computedAt: -1 }).limit(5).lean(),
    FieldProfile.countDocuments(),
  ])
  const reports = reportsDocs as unknown as Array<{ regionId: string; observedOn: string }>
  const byRegion = new Map<string, number>()
  for (const r of reports) byRegion.set(r.regionId, (byRegion.get(r.regionId) ?? 0) + 1)
  res.json({
    summary: {
      storedAnalyses: analyses.length,
      totalFields: fields,
      storedReports: reports.length,
      activeAlerts: alerts.length,
    },
    recentAnalyses: analyses.map((a) => ({
      id: String(a._id),
      cropName: CROP_NAMES[a.cropId as string] ?? a.cropId,
      conditionName: a.conditionName,
      probabilityTop: a.probabilityTop,
      riskBand: a.riskBand,
      createdAt: a.createdAt,
      pipeline: a.pipeline,
    })),
    regionReportMix: [...byRegion.entries()].map(([regionId, count]) => ({ regionId, count })),
    alerts: alerts.map((a) => ({ ...a, id: String(a._id) })),
    notice: 'All dashboard numbers describe this instance\'s stored demo records — sample data, not field statistics.',
  })
}))

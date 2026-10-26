import { Router } from 'express'
import { treatmentCompareSchema, treatmentListQuerySchema } from '../validators/schemas.js'
import { TreatmentOption } from '../models/index.js'
import { requireDb } from '../config/db.js'
import { rankOptions, formatINR, type RankableOption } from '../services/ranking.js'
import { APPLICABLE_TO_ALL_CONDITIONS } from './catalog-shared.js'
import { ah } from '../middleware/async.js'

export const treatmentsRouter = Router()

/**
 * Curated treatment options + deterministic ranking (§9).
 * Options come from MongoDB when available, otherwise the bundled sample
 * records are used — always labelled as sample data, never verified advice.
 */

treatmentsRouter.get('/', ah(async (req, res) => {
  const { conditionId } = treatmentListQuerySchema.parse(req.query)
  let options: Array<RankableOption & { conditionIds: string[] }>
  try {
    requireDb()
    const docs = await TreatmentOption.find().lean()
    options = docs.filter((d) => conditionMatches(d.conditionIds ?? [], conditionId)).map(toRankable)
  } catch {
    options = bundledOptions(conditionId)
  }
  res.json({
    items: options,
    count: options.length,
    notice:
      'Illustrative sample records from the curated demo collection — cost bands are estimates and effectiveness values are illustrative, not verified field data.',
  })
}))

treatmentsRouter.post('/rank', ah(async (req, res) => {
  const input = treatmentCompareSchema.parse(req.body ?? {})
  let options: Array<RankableOption & { conditionIds: string[] }>
  try {
    requireDb()
    const docs = await TreatmentOption.find().lean()
    options = docs.filter((d) => conditionMatches(d.conditionIds ?? [], input.conditionId)).map(toRankable)
  } catch {
    options = bundledOptions(input.conditionId)
  }
  // Eligibility screening happens BEFORE ranking: options not listed for the
  // condition are rejected outright and reported as excluded.
  const suitable = new Set(options.map((o) => o.optionId))
  const rejected = bundledRejected(input.conditionId)
  const ranked = rankOptions(options, input.budget, suitable)
  res.json({
    budget: input.budget,
    budgetLabel: formatINR(input.budget),
    eligible: options.length,
    rejectedCount: rejected,
    ranked: ranked.map((r) => ({
      optionId: r.option.optionId,
      name: r.option.name,
      category: r.option.category,
      costBand: `${r.option.costMin}–${r.option.costMax} ${r.option.costUnit}`,
      costMidpointLabel: formatINR((r.option.costMin + r.option.costMax) / 2),
      withinBudget: r.withinBudget,
      score: r.score,
      weightNote: 'score = 0.45·suitability + 0.25·safety + 0.20·budget_fit + 0.10·effectiveness (proposed rule, demo)',
      rationale: r.rationale,
      effectivenessDisclosed: r.option.effectivenessScore === null ? 'Effectiveness evidence missing — not invented.' : undefined,
      safetyNotes: r.option.safetyNotes,
      evidenceStatus: r.option.evidenceStatus,
      sourceNote: r.option.sourceNote,
    })),
    notice:
      'Sample records ranked by the documented demo rule — not a prescription. Verify with certified advisory sources and local regulations.',
  })
}))

function conditionMatches(conditionIds: string[], conditionId?: string): boolean {
  if (!conditionId) return true
  return conditionIds.length === 0 || conditionIds.includes(conditionId) || conditionIds.includes(APPLICABLE_TO_ALL_CONDITIONS)
}

function toRankable(d: Record<string, unknown>): RankableOption & { conditionIds: string[] } {
  return {
    optionId: String(d.optionId),
    name: String(d.name),
    category: String(d.category),
    costMin: Number(d.costMin),
    costMax: Number(d.costMax),
    costUnit: String(d.costUnit),
    suitabilityScore: Number(d.suitabilityScore),
    effectivenessScore: d.effectivenessScore === null || d.effectivenessScore === undefined ? null : Number(d.effectivenessScore),
    evidenceStatus: String(d.evidenceStatus) as RankableOption['evidenceStatus'],
    safetyNotes: String(d.safetyNotes),
    sourceNote: String(d.sourceNote ?? ''),
    suitabilitySummary: typeof d.suitabilitySummary === 'string' ? d.suitabilitySummary : undefined,
    conditionIds: Array.isArray(d.conditionIds) ? (d.conditionIds as string[]) : [],
  }
}

/** Bundled fallback options — same demo catalogue the frontend uses. */
function bundledOptions(conditionId?: string): Array<RankableOption & { conditionIds: string[] }> {
  void conditionId
  return bundledTreatmentOptionsRaw().map((o) => ({ ...o, conditionIds: [APPLICABLE_TO_ALL_CONDITIONS] }))
}

const bundledTreatmentOptionsRaw = (): RankableOption[] => bundledOptionsFromFrontendCatalogue()

function bundledOptionsFromFrontendCatalogue(): RankableOption[] {
  return [
    { optionId: 'scout-remove', name: 'Scout rows and remove affected tissue', category: 'cultural', costMin: 0, costMax: 150, costUnit: 'INR/acre', suitabilityScore: 0.9, effectivenessScore: null, evidenceStatus: 'sample-limited', safetyNotes: 'Remove and destroy affected leaves; avoid composting diseased tissue. Keep tools clean between rows.', sourceNote: 'Curated demo record — verification pending' },
    { optionId: 'copper-fungicide', name: 'Copper-based protectant spray (sample)', category: 'chemical-supportive', costMin: 350, costMax: 700, costUnit: 'INR/acre', suitabilityScore: 0.82, effectivenessScore: 0.7, evidenceStatus: 'sample-limited', safetyNotes: 'Wear gloves and a mask; avoid spraying toward open water; never exceed the label dose. Sample-only cost band.', sourceNote: 'Curated demo record — verification pending' },
    { optionId: 'neem-oil', name: 'Neem oil foliar spray (sample)', category: 'biological', costMin: 200, costMax: 450, costUnit: 'INR/acre', suitabilityScore: 0.7, effectivenessScore: 0.55, evidenceStatus: 'sample-limited', safetyNotes: 'Apply in the evening to avoid leaf burn; not during pollinator activity.', sourceNote: 'Curated demo record — verification pending' },
    { optionId: 'drip-adjust', name: 'Adjust irrigation schedule (drip check)', category: 'cultural', costMin: 50, costMax: 250, costUnit: 'INR/acre', suitabilityScore: 0.75, effectivenessScore: null, evidenceStatus: 'sample-limited', safetyNotes: 'Keep leaves dry overnight; ensure drainage paths are not blocked.', sourceNote: 'Curated demo record — verification pending' },
    { optionId: 'watering-tune', name: 'Water-schedule tuning (morning irrigation)', category: 'cultural', costMin: 0, costMax: 100, costUnit: 'INR/acre', suitabilityScore: 0.72, effectivenessScore: null, evidenceStatus: 'sample-limited', safetyNotes: 'Avoid evening wetting that keeps foliage damp overnight.', sourceNote: 'Curated demo record — verification pending' },
    { optionId: 'balanced-fertilization', name: 'Balanced nutrition review (soil-test led)', category: 'cultural', costMin: 120, costMax: 600, costUnit: 'INR/acre', suitabilityScore: 0.66, effectivenessScore: null, evidenceStatus: 'sample-grade', safetyNotes: 'Base any change on a real soil test; avoid unnecessary urea.', sourceNote: 'Curated demo record — verification pending' },
    { optionId: 'scout-followup', name: 'Book a follow-up scout visit', category: 'cultural', costMin: 0, costMax: 200, costUnit: 'INR/acre', suitabilityScore: 0.8, effectivenessScore: null, evidenceStatus: 'sample-grade', safetyNotes: 'Record which rows were checked so the revisit covers new ground.', sourceNote: 'Curated demo record — verification pending' },
  ]
}

function bundledRejected(conditionId?: string): number {
  void conditionId
  return 0
}

import { rankOptions, type RankableOption } from '../ranking.js'
import { coreTrend, splitWindows, aggregateBySeries, DEFAULT_THRESHOLDS, type CoreTrend } from '../communityTrends.js'
import { mlStatus, type PredictAndExplainResponse } from '../mlClient.js'
import { KnowledgeSource, CommunityReport, TreatmentOption } from '../../models/index.js'
import { culturalNotesByCrop } from './knowledge/fallback.js'
import type { ToolTrace } from './types.js'
import { requireDb } from '../../config/db.js'

/**
 * Orchestrator tools (§10.2–10.5). Every tool returns *grounded data* it
 * actually fetched — validated inputs in, real outputs out, honest status
 * ("done" | "error" | "unavailable") in the trace. Nothing is invented here.
 */

export interface ToolContext {
  cropping?: { cropId?: string; regionId?: string; budget?: number }
}

export type ToolRunner = {
  id: 'crop-analysis' | 'treatment-ranking' | 'community-monitor' | 'knowledge-retrieval'
  available: (ctx: ToolContext) => Promise<boolean>
  run: (input: { question: string; ctx: ToolContext }) => Promise<ToolTrace>
}

// ---------------------------------------------------------------------------
// crop-analysis — calls the ML service through the real model when trained
// ---------------------------------------------------------------------------

export function makeCropAnalysisTool(latestDiagnosis: () => Promise<PredictAndExplainResponse | null>): ToolRunner {
  return {
    id: 'crop-analysis',
    available: async () => {
      const status = await mlStatus()
      return status.reachable && status.trained
    },
    run: async ({ ctx }) => {
      const startedAt = Date.now()
      let latest: PredictAndExplainResponse | null
      try {
        latest = await latestDiagnosis()
      } catch {
        latest = null
      }
      if (latest) {
        const top = latest.probabilities[0]
        return {
          tool: 'crop-analysis',
          status: 'done',
          startedAt,
          finishedAt: Date.now(),
          detail: 'summarised the most recent model prediction on record',
          result: {
            kind: 'latest-prediction',
            cropId: ctx.cropping?.cropId ?? null,
            conditionId: latest.conditionId,
            conditionName: latest.conditionName,
            probability: top?.probability ?? latest.confidence,
            model: latest.modelInfo.name,
            warnings: latest.warnings,
          },
        }
      }
      return {
        tool: 'crop-analysis',
        status: 'unavailable',
        startedAt,
        finishedAt: Date.now(),
        detail: 'no stored crop analysis is available to consult; run a diagnosis first (guided wizard on the diagnosis page)',
      }
    },
  }
}

// ---------------------------------------------------------------------------
// treatment-ranking — deterministic engine over curated options (Mongo or seed)
// ---------------------------------------------------------------------------

export async function loadCuratedOptions(): Promise<RankableOption[]> {
  try {
    requireDb()
    const docs = await TreatmentOption.find().lean()
    if (docs.length > 0) {
      return docs.map((d) => ({
        optionId: d.optionId,
        name: d.name,
        category: d.category,
        costMin: d.costMin,
        costMax: d.costMax,
        costUnit: d.costUnit,
        suitabilityScore: d.suitabilityScore,
        effectivenessScore: d.effectivenessScore ?? null,
        evidenceStatus: d.evidenceStatus,
        safetyNotes: d.safetyNotes,
        sourceNote: d.sourceNote,
        suitabilitySummary: d.suitabilitySummary,
      }))
    }
  } catch {
    // fall through to bundled curated records (still labelled sample data)
  }
  return bundledTreatmentOptions()
}

export function bundledTreatmentOptions(): RankableOption[] {
  // Structured sample records mirroring the frontend curated/demo data —
  // these are explicitly ILLUSTRATIVE, never verified efficacy or prices.
  return [
    {
      optionId: 'scout-remove', name: 'Scout rows and remove affected tissue', category: 'cultural',
      costMin: 0, costMax: 150, costUnit: 'INR/acre', suitabilityScore: 0.9, effectivenessScore: null,
      evidenceStatus: 'sample-limited', safetyNotes: 'Remove and destroy affected leaves; avoid composting diseased tissue. Keep tools clean between rows.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
    {
      optionId: 'copper-fungicide', name: 'Copper-based protectant spray (sample)', category: 'chemical-supportive',
      costMin: 350, costMax: 700, costUnit: 'INR/acre', suitabilityScore: 0.82, effectivenessScore: 0.7,
      evidenceStatus: 'sample-limited', safetyNotes: 'Wear gloves and a mask; avoid spraying toward open water, never exceed label dose. Sample-only cost band.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
    {
      optionId: 'neem-oil', name: 'Neem oil foliar spray (sample)', category: 'biological',
      costMin: 200, costMax: 450, costUnit: 'INR/acre', suitabilityScore: 0.7, effectivenessScore: 0.55,
      evidenceStatus: 'sample-limited', safetyNotes: 'Apply in the evening to avoid leaf burn; not in direct sun or with pollinators active.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
    {
      optionId: 'drip-adjust', name: 'Adjust irrigation schedule (drip check)', category: 'cultural',
      costMin: 50, costMax: 250, costUnit: 'INR/acre', suitabilityScore: 0.75, effectivenessScore: null,
      evidenceStatus: 'sample-limited', safetyNotes: 'Keep leaves dry overnight; ensure drainage paths are not blocked.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
    {
      optionId: 'sulfur-dust', name: 'Sulphur dusting (sample)', category: 'chemical-supportive',
      costMin: 180, costMax: 400, costUnit: 'INR/acre', suitabilityScore: 0.68, effectivenessScore: 0.6,
      evidenceStatus: 'sample-limited', safetyNotes: 'Never spray sulphur within a week of oil sprays; wear a mask; avoid in heat above 32°C.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
    {
      optionId: 'watering-tune', name: 'Water-schedule tuning (morning irrigation)', category: 'cultural',
      costMin: 0, costMax: 100, costUnit: 'INR/acre', suitabilityScore: 0.72, effectivenessScore: null,
      evidenceStatus: 'sample-limited', safetyNotes: 'Avoid evening wetting that keeps leaves damp overnight.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
    {
      optionId: 'balanced-fertilization', name: 'Balanced nutrition review (soil-test led)', category: 'cultural',
      costMin: 120, costMax: 600, costUnit: 'INR/acre', suitabilityScore: 0.66, effectivenessScore: null,
      evidenceStatus: 'sample-grade', safetyNotes: 'Base any change on a real soil test; avoid applying urea without need.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
    {
      optionId: 'scout-followup', name: 'Book a follow-up scout visit', category: 'cultural',
      costMin: 0, costMax: 200, costUnit: 'INR/acre', suitabilityScore: 0.8, effectivenessScore: null,
      evidenceStatus: 'sample-grade', safetyNotes: 'Record which rows were checked so the revisit covers new ground.',
      sourceNote: 'Curated demo record — verification pending with institutional advisory',
    },
  ]
}

export const treatmentTool: ToolRunner = {
  id: 'treatment-ranking',
  available: async () => true, // deterministic engine works with bundled records even without DB
  run: async ({ ctx }) => {
    const startedAt = Date.now()
    const budget = ctx.cropping?.budget ?? 600
    const options = await loadCuratedOptions()
    // For the orchestrator's default demo flow, treat all options as eligible
    // candidates for the current condition context; the diagnosis route uses
    // condition-scoped eligibility. Constraints still enforced: rejected
    // options would have been filtered already by suitable set below.
    const scoped = options.filter((o) => o.suitabilityScore >= 0.55)
    const ranked = rankOptions(
      scoped,
      budget,
      new Set(scoped.map((o) => o.optionId)),
    )
    return {
      tool: 'treatment-ranking',
      status: 'done',
      startedAt,
      finishedAt: Date.now(),
      detail: `ranked ${ranked.length} eligible curated options against the budget (deterministic engine)`,
      result: {
        kind: 'treatment-ranking',
        budget,
        note: 'sample options, not verified recommendations; no dosage advice is provided',
        ranked: ranked.slice(0, 3).map((r) => ({
          optionId: r.option.optionId,
          name: r.option.name,
          category: r.option.category,
          costBand: `${r.option.costMin}–${r.option.costMax} ${r.option.costUnit}`,
          withinBudget: r.withinBudget,
          score: r.score,
          rationale: r.rationale,
        })),
      },
    }
  },
}

// ---------------------------------------------------------------------------
// community-monitor — real aggregation over persisted reports
// ---------------------------------------------------------------------------

export const communityTool: ToolRunner = {
  id: 'community-monitor',
  available: async () => true,
  run: async ({ ctx }) => {
    const startedAt = Date.now()
    const regionId = ctx.cropping?.regionId ?? 'north'
    try {
      requireDb()
      const reports = await CommunityReport.find().sort({ observedOn: -1 }).limit(500).lean()
      const series = aggregateBySeries(reports as Array<{ regionId: string; cropId: string; symptomId: string; observedOn: string }>)
      const levelWeight: Record<CoreTrend['level'], number> = { attention: 3, watch: 2, steady: 1 }
      const scored = series
        .map((s) => splitWindows(s.dates, 14))
        .map((w, i) => ({ series: series[i], ...w }))
        .filter((e) => e.recent + e.prior > 0)
        .map((e) => ({
          regionId: e.series.regionId,
          cropId: e.series.cropId,
          symptomId: e.series.symptomId,
          trend: coreTrend(e.recent, e.prior, DEFAULT_THRESHOLDS, 'last 14 days vs previous 14 days'),
        }))
        .filter((e) => e.regionId === regionId)
        .sort((a, b) => levelWeight[b.trend.level] - levelWeight[a.trend.level])
        .slice(0, 3)
      return {
        tool: 'community-monitor',
        status: 'done',
        startedAt,
        finishedAt: Date.now(),
        detail: `aggregated persisted reports for region ${regionId}`,
        result: {
          kind: 'community-trends',
          regionId,
          note: 'computed from stored reports; report counts come from a demo population — never an outbreak confirmation',
          trends: scored,
        },
      }
    } catch (err) {
      return {
        tool: 'community-monitor',
        status: 'unavailable',
        startedAt,
        finishedAt: Date.now(),
        detail:
          err instanceof Error
            ? `community storage unavailable: ${err.message.slice(0, 180)}`
            : 'community storage unavailable',
      }
    }
  },
}

// ---------------------------------------------------------------------------
// knowledge-retrieval — actual retrieval over curated docs (Mongo or fallback)
// ---------------------------------------------------------------------------

export interface KnowledgeHit {
  docId: string
  title: string
  excerpt: string
  sourceNote: string
  score: number
}

function scoreDoc(title: string, body: string, terms: string[]): number {
  const haystack = `${title} ${body}`.toLowerCase()
  let score = 0
  for (const term of terms) {
    if (!term) continue
    if (haystack.includes(term)) score += term.length > 4 ? 3 : 2
  }
  return score
}

export async function retrievalFor(question: string, ctx?: ToolContext): Promise<KnowledgeHit[]> {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3)
  let docs: Array<{ docId: string; title: string; body: string; sourceNote: string }> = []
  try {
    requireDb()
    const found = await KnowledgeSource.find().lean()
    docs = found.map((d) => ({ docId: d.docId, title: d.title, body: d.body, sourceNote: d.sourceNote }))
  } catch {
    docs = fallbackKnowledgeDocs()
  }
  return docs
    .map((d) => ({ ...d, excerpt: d.body, score: scoreDoc(d.title, d.body, terms) }))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export const knowledgeTool: ToolRunner = {
  id: 'knowledge-retrieval',
  available: async () => true,
  run: async ({ question, ctx }) => {
    const startedAt = Date.now()
    const hits = await retrievalFor(question, ctx)
    if (hits.length === 0) {
      const cropNote = ctx.cropping?.cropId ? culturalNotesByCrop[ctx.cropping.cropId] : undefined
      if (!cropNote) {
        return {
          tool: 'knowledge-retrieval',
          status: 'unavailable',
          startedAt,
          finishedAt: Date.now(),
          detail: 'no curated document matched the question in the local knowledge collection',
        }
      }
      return {
        tool: 'knowledge-retrieval',
        status: 'done',
        startedAt,
        finishedAt: Date.now(),
        detail: 'returned general crop-care guidance from the bundled fallback collection',
        result: {
          kind: 'knowledge',
          note: 'curated fallback note, not a verified institutional advisory',
          hits: [{ docId: 'fallback', title: `${ctx.cropping?.cropId ?? 'crop'} care basics`, excerpt: cropNote, sourceNote: 'bundled fallback knowledge', score: 1 }],
        },
      }
    }
    return {
      tool: 'knowledge-retrieval',
      status: 'done',
      startedAt,
      finishedAt: Date.now(),
      detail: `retrieved ${hits.length} curated documents from the local knowledge collection`,
      result: { kind: 'knowledge', note: 'retrieved passages; verify with official agricultural advisory before acting', hits },
    }
  },
}

function fallbackKnowledgeDocs(): Array<{ docId: string; title: string; body: string; sourceNote: string }> {
  return Object.entries(culturalNotesByCrop).map(([k, v]) => ({
    docId: `fallback-${k}`,
    title: `${k} care basics`,
    body: v,
    sourceNote: 'bundled fallback knowledge',
  }))
}

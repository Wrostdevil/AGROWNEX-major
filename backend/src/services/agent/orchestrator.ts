import { generateAnswer, llmConfigured } from './provider.js'
import { validateResponse, enforce, safetyFooter } from './safety.js'
import { treatmentTool, communityTool, knowledgeTool, makeCropAnalysisTool, type ToolContext, type ToolRunner } from './tools.js'
import { CropAnalysis } from '../../models/index.js'
import { databaseStatus } from '../../config/db.js'
import { type PredictAndExplainResponse } from '../mlClient.js'
import type { AgentResponse, ToolTrace } from './types.js'

/**
 * Tool-using orchestrator (§10.1, §10.7).
 *
 * - Deterministic intent routing maps the question to an ordered tool plan
 *   (keyword rules, no ML needed — always available).
 * - Tools are executed for real; traces record exactly what ran.
 * - The provider layer composes the answer strictly from tool facts and is
 *   replaced by an optional LLM when configured. The fallback is always
 *   labelled "deterministic-fallback".
 * - A deterministic safety review checks grounding, uncertainty notices and
 *   overclaim/dosage patterns before the response leaves the service.
 */

const PRIMARY_INTENTS = [
  { id: 'treatment', keywords: ['treatment', 'treat', 'spray', 'budget', 'cost', 'option', 'plan', 'rank'] as string[], tool: 'treatment-ranking' as const },
  { id: 'community', keywords: ['outbreak', 'community', 'region', 'trend', 'reports', 'neighbour', 'neighbor', 'village', 'spread'] as string[], tool: 'community-monitor' as const },
  { id: 'diagnosis', keywords: ['diagnose', 'diagnosis', 'prediction', 'model', 'explain', 'my crop', 'assessment', 'confidence'] as string[], tool: 'crop-analysis' as const },
  { id: 'knowledge', keywords: ['how', 'what', 'why', 'prevent', 'care', 'schedule', 'water', 'support'] as string[], tool: 'knowledge-retrieval' as const },
]

function pickToolPlan(question: string): Array<ToolRunner['id']> {
  const q = question.toLowerCase()
  const scored = PRIMARY_INTENTS.map((intent) => ({
    id: intent.tool,
    score: intent.keywords.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0),
  }))
    .sort((a, b) => b.score - a.score)
  const plan: Array<ToolRunner['id']> = scored.filter((s) => s.score > 0).map((s) => s.id)
  // Always consult curated knowledge as supporting context, last in the plan.
  if (!plan.includes('knowledge-retrieval')) plan.push('knowledge-retrieval')
  return plan
}

export interface OrchestratorRequest {
  question: string
  context: ToolContext
  /** history length used only for tone decisions (not sent to tools) */
  turn?: number
}

export async function orchestrate(req: OrchestratorRequest): Promise<AgentResponse> {
  const plan = pickToolPlan(req.question)
  const cropAnalysisTool = makeCropAnalysisTool(loadLatestMlPrediction)
  const runners: Record<string, ToolRunner> = {
    'crop-analysis': cropAnalysisTool,
    'treatment-ranking': treatmentTool,
    'community-monitor': communityTool,
    'knowledge-retrieval': knowledgeTool,
  }

  const traces: ToolTrace[] = []
  for (const id of plan.slice(0, 2)) {
    // Primary tool + supporting knowledge consult — keep the demo workflow tight.
    const runner = runners[id]
    try {
      const trace = await runner.run({ question: req.question, ctx: req.context })
      traces.push(trace)
    } catch (err) {
      traces.push({
        tool: id as ToolTrace['tool'],
        status: 'error',
        detail: err instanceof Error ? err.message.slice(0, 200) : 'tool failed',
        startedAt: Date.now(),
        finishedAt: Date.now(),
      })
    }
  }

  const facts = composeFacts(traces)
  const db = databaseStatus()
  const mode = (PRIMARY_INTENTS.find((intent) => intent.tool === plan[0])?.id) ?? 'general'
  const uncertainty = db.connected
    ? 'Reminder: responses use stored demo reports and sample records; nothing here is a confirmed outbreak, a certified diagnosis, or a treatment prescription.'
    : 'Reminder: the demo store is not connected to a database right now, so responses use bundled sample records only; nothing here is a confirmed outbreak, a certified diagnosis, or a treatment prescription.'

  const providerResult = await generateAnswer(
    {
      facts,
      userQuestion: req.question,
      uncertaintyNotice: uncertainty,
    },
    mode as 'diagnosis' | 'treatment' | 'community' | 'knowledge' | 'general',
  )

  const groundedCount = traces.filter((t) => t.status === 'done').length
  const findings = validateResponse(providerResult.text, { groundedToolCount: groundedCount, mode: providerResult.mode })

  let content = providerResult.text
  let safetyNote: string | null = null
  try {
    enforce(findings)
  } catch (err) {
    // Never surface an unsafe reply; replace it with the tool facts + notice.
    content = [
      'I could not compose a safe answer for that question.',
      'Here are the grounded tool results instead — please treat them as sample data only.',
      '',
      ...facts.map((f) => `• ${f}`),
      '',
      uncertainty,
      err instanceof Error ? `(safety review: ${err.message})` : '(safety review blocked this reply)',
    ].join('\n')
    safetyNote = 'safety-rewrote-response'
  }

  const steps = traces.map((t, i) => ({
    id: `${t.tool}-${i}`,
    label: TOOL_LABELS[t.tool],
    detail: t.detail,
    capability: CAPABILITY_NAMES[t.tool],
    status: 'done' as const,
  }))

  const related = RELATED_BY_MODE[mode] ?? RELATED_BY_MODE.general

  return {
    content: content + safetyFooter({
      content, provider: providerResult.provider, steps, toolTraces: traces, contextCards: [], related, suggestedFollowUp: [], limitations: [],
    }),
    provider: llmConfigured() ? providerResult.provider : 'deterministic-fallback',
    steps,
    toolTraces: traces,
    contextCards: composeContextCards(traces, req.context),
    related,
    suggestedFollowUp: FOLLOW_UPS[mode] ?? FOLLOW_UPS.general,
    limitations: LIMITATIONS,
    // extra provenance fields for the frontend demo surface
    ...(safetyNote ? { safetyNote } : {}),
    dbConnected: db.connected,
    mode: mode as string,
  }
}

const TOOL_LABELS: Record<ToolTrace['tool'], string> = {
  'crop-analysis': 'Crop analysis — reading the latest model prediction',
  'treatment-ranking': 'Treatment ranking — running the deterministic engine',
  'community-monitor': 'Community monitoring — aggregating stored reports',
  'knowledge-retrieval': 'Knowledge retrieval — searching curated docs',
}

const CAPABILITY_NAMES: Record<ToolTrace['tool'], string> = {
  'crop-analysis': 'Crop analysis',
  'treatment-ranking': 'Treatment planning',
  'community-monitor': 'Community watch',
  'knowledge-retrieval': 'Agricultural knowledge',
}

const RELATED_BY_MODE: Record<string, Array<{ label: string; to: string }>> = {
  diagnosis: [
    { label: 'Open Explanation view', to: '/app/explanations' },
    { label: 'Run a new analysis', to: '/app/diagnosis' },
  ],
  treatment: [
    { label: 'Treatment planner', to: '/app/treatments' },
    { label: 'Save comparisons', to: '/app/history' },
  ],
  community: [
    { label: 'Community center', to: '/app/community' },
    { label: 'Submit a report', to: '/app/community' },
  ],
  knowledge: [
    { label: 'Research notes', to: '/research' },
    { label: 'How Agrownex works', to: '/how-it-works' },
  ],
  general: [{ label: 'Dashboard', to: '/app' }],
}

const FOLLOW_UPS: Record<string, string[]> = {
  diagnosis: ['What influenced the prediction?', 'What are the treatment options within my budget?'],
  treatment: ['Which options are cultural rather than chemical?', 'Are any options above my budget?'],
  community: ['What is the trend for another region?', 'How do I submit a community report?'],
  knowledge: ['(demo) What might cause leaf yellowing?', '(demo) How do I store harvest safely?'],
  general: ['(demo) Try: treatment options', '(demo) Try: community trend', '(demo) Try: latest diagnosis'],
}

function composeFacts(traces: ToolTrace[]): string[] {
  const facts: string[] = []
  for (const t of traces) {
    if (t.status !== 'done' || t.result === undefined) {
      facts.push(`${TOOL_LABELS[t.tool]}: ${t.status === 'unavailable' ? 'unavailable — ' : 'error — '}${t.detail}`)
      continue
    }
    const r = t.result as Record<string, unknown>
    switch (t.tool) {
      case 'crop-analysis': {
        facts.push(`Latest model prediction: ${String(r.conditionName)} (probability ${Number(r.probability ?? 0).toFixed(2)}, model ${String(r.model ?? 'n/a')}). Warnings: ${(r.warnings as string[] | undefined)?.join(' ') ?? 'none'}.`)
        break
      }
      case 'treatment-ranking': {
        const ranked = (r.ranked as Array<{ name: string; costBand: string; withinBudget: boolean; score: number }>) ?? []
        const summary = ranked
          .map((o, i) => `${i + 1}. ${o.name} — ${o.costBand}${o.withinBudget ? '' : ' (above budget)'}, decision score ${o.score.toFixed(2)}`)
          .join('; ')
        facts.push(`Ranking engine (budget ${String(r.budget)} INR/acre, sample options): ${summary || 'no eligible options remained after suitability screening'}.`)
        break
      }
      case 'community-monitor': {
        const trends = (r.trends as Array<{ regionId: string; cropId: string; symptomId: string; trend: { level: string; recentCount: number; priorCount: number } }>) ?? []
        if (trends.length === 0) facts.push('Community tool: no active series for the selected region in the report window (sample population).')
        for (const t2 of trends) {
          facts.push(`Community watch (${t2.regionId}, ${t2.cropId}, ${t2.symptomId}): level ${t2.trend.level}, ${t2.trend.recentCount} recent vs ${t2.trend.priorCount} prior reports — potential increase in reported symptoms, not a confirmed outbreak.`)
        }
        break
      }
      case 'knowledge-retrieval': {
        const hits = (r.hits as Array<{ title: string; excerpt: string; sourceNote: string }>) ?? []
        for (const hit of hits) facts.push(`Knowledge: "${hit.title}" — ${hit.excerpt.slice(0, 220)} (${hit.sourceNote}).`)
        break
      }
    }
  }
  return facts.length > 0 ? facts : ['No tool produced a usable result for this question. Run a diagnosis first or rephrase (e.g. "treatment options under 500").']
}

function composeContextCards(traces: ToolTrace[], ctx: ToolContext): Array<{ title: string; value: string; meta?: string }> {
  const cards: Array<{ title: string; value: string; meta?: string }> = []
  for (const t of traces) {
    if (t.status === 'done' && t.tool === 'treatment-ranking') {
      cards.push({ title: 'Budget envelope', value: `${ctx.cropping?.budget ?? 600} INR/acre (sample)`, meta: 'deterministic engine' })
    }
    if (t.status === 'done' && t.tool === 'crop-analysis') {
      cards.push({
        title: 'Model source',
        value: llmConfigured() ? 'ML service + configured LLM' : 'ML service (trained artifacts when prepared)',
        meta: 'see /app/explanations',
      })
    }
  }
  return cards.slice(0, 2)
}

async function loadLatestMlPrediction(): Promise<PredictAndExplainResponse | null> {
  // Without a reachable database there are no stored analyses to consult —
  // bail immediately instead of waiting on a doomed Mongo connection.
  if (!databaseStatus().connected) return null
  const doc = await CropAnalysis.findOne().sort({ createdAt: -1 }).lean()
  if (!doc) return null
  const modelMeta = doc.modelMeta as { name: string; version: string; task: string; trained: boolean; limitations: string[] }
  return {
    conditionId: doc.conditionId,
    conditionName: doc.conditionName,
    probabilities: (doc.probabilities as Array<{ conditionId: string; name: string; probability: number }>) ?? [],
    confidence: Number(doc.probabilityTop ?? 0),
    modelInfo: modelMeta,
    warnings: doc.pipeline === 'unavailable-fallback' ? ['stored as a fallback record'] : [],
    method: `${(doc.features as unknown[] | undefined)?.length ?? 0} contributing features stored`,
    baseline: 0,
    features: ((doc.features as Array<{ key: string; label: string; value: string; contribution: number; direction: string }>) ?? []).map((f) => ({
      feature: f.key,
      label: f.label,
      value: f.value,
      contribution: f.contribution,
      direction: f.direction as 'supports' | 'against',
    })),
    caveats: [doc.uncertaintyNote],
    requestId: doc.mlRequestId ?? undefined,
  }
}

const LIMITATIONS = [
  'The assistant composes replies from the same demo tools the app exposes — it adds no information of its own in fallback mode.',
  'Treatment, cost and community figures are sample data. Consult a certified agricultural advisory before acting.',
]

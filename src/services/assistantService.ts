import type { CropAnalysisInput, CropAnalysisResult, TreatmentOption } from '../types'
import { rankTreatments, TREATMENTS, type RankedTreatment } from '../data/treatments'
import { conditionById } from '../data/conditions'
import { cropName, regionName, SYMPTOM_FILTERS } from '../data/catalog'
import { getSeries } from '../data/community'
import { delay } from './storage'
import { sendAssistantMessage } from './api/endpoints'
import { formatCompactINR } from '../utils'

/**
 * assistantService — deterministic local conversation service.
 *
 * Routes supported questions to grounded responses via local
 * functions. The interface (`respond(messages)` returning an AssistantMessage)
 * is deliberately replaceable by a real agent orchestrator later.
 */
export interface AssistantTurn {
  content: string
}

const HELP_TOPIC_LINKS = [
  { label: 'Open crop diagnosis', to: '/app/diagnosis' },
  { label: 'Open treatment planner', to: '/app/treatments' },
]

interface Intent {
  id: string
  keywords: string[]
  answer: (ctx: AssistantContextInput) => AssistantReply
}

export interface AssistantContextInput {
  latest?: { result: CropAnalysisResult }
  budget?: number
}

export interface AssistantReply {
  content: string
  related?: { label: string; to: string }[]
  contextCards?: { title: string; value: string; meta?: string }[]
  agentSteps?: { id: string; label: string; detail?: string; capability: string }[]
}

function diagnosisContext(result: CropAnalysisResult): { title: string; value: string; meta?: string }[] {
  return [
    { title: 'Latest assessment', value: result.conditionName, meta: 'Deterministic local result' },
    { title: 'Confidence band', value: `${Math.round(result.confidence * 100)}%`, meta: 'Engine posterior' },
    { title: 'Crop', value: result.input.cropName || cropName(result.input.cropId) },
  ]
}

const AGENT_DIAGNOSE_STEPS = [
  { id: 's1', label: 'Understanding the request', capability: 'Main orchestrator' },
  { id: 's2', label: 'Gathering context from your last assessment', capability: 'Knowledge & context tool' },
  { id: 's3', label: 'Composing a farmer-friendly explanation', capability: 'Explanation capability' },
  { id: 's4', label: 'Adding uncertainty and safety notes', capability: 'Safety-review capability' },
] as const

const AGENT_TREATMENT_STEPS = [
  { id: 's1', label: 'Understanding the request', capability: 'Main orchestrator' },
  { id: 's2', label: 'Fetching condition + treatment options', capability: 'Knowledge & context tool' },
  { id: 's3', label: 'Running the deterministic ranking', capability: 'Cost-aware treatment capability' },
  { id: 's4', label: 'Checking budget and safety constraints', capability: 'Safety-review capability' },
] as const

const AGENT_COMMUNITY_STEPS = [
  { id: 's1', label: 'Understanding the request', capability: 'Main orchestrator' },
  { id: 's2', label: 'Filtering region and crop', capability: 'Knowledge & context tool' },
  { id: 's3', label: 'Summarising community trend statistics', capability: 'Community early-warning capability' },
  { id: 's4', label: 'Adding uncertainty notes', capability: 'Safety-review capability' },
] as const

const INTENTS: Intent[] = [
  {
    id: 'symptoms',
    keywords: ['symptom', 'spots', 'yellow', 'wilt', 'lesion', 'rust', 'mildew', 'leaf', 'help me understand'],
    answer: (ctx) => ({
      content: ctx.latest
        ? `Based on your latest assessment (${ctx.latest.result.conditionName}), the pattern mainly leaned on: ${ctx.latest.result.matchedSymptoms.slice(0, 3).join(', ')}. For anything actionable, confirm with a close inspection of the plant or a photo.`
        : 'I can help interpret crop symptoms. Describe what you see on the leaves, plant or fruit — or run a quick diagnosis first so we can talk about the same inputs. Useful basics: where the pattern started (older or younger leaves), whether spots have rings, edges, or a powdery feel, and how quickly it spread.',
      related: ctx.latest ? HELP_TOPIC_LINKS.slice(0, 1) : HELP_TOPIC_LINKS,
      contextCards: ctx.latest ? diagnosisContext(ctx.latest.result) : undefined,
      agentSteps: [...AGENT_DIAGNOSE_STEPS],
    }),
  },
  {
    id: 'explain',
    keywords: ['explain', 'why was this prediction', 'why this', 'importance', 'shap', 'confidence'],
    answer: (ctx) => {
      if (!ctx.latest) {
        return {
          content:
            'There is no assessment to explain yet. Run a diagnosis first — then I can walk through which observations drove the result and by how much.',
          related: [HELP_TOPIC_LINKS[0]],
          agentSteps: [...AGENT_DIAGNOSE_STEPS],
        }
      }
      const top = [...ctx.latest.result.features].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))[0]
      return {
        content: `The main factor in the latest assessment was: ${top.label} (weight ${top.contribution.toFixed(2)}). In plain terms: ${top.detail} Note that these weights come from the local scoring engine, not SHAP values from a trained model — they describe the assessment rather than prove cause.`,
        related: [{ label: 'Open explainable results', to: `/app/explanations?analysis=${ctx.latest.result.id}` }],
        contextCards: diagnosisContext(ctx.latest.result),
        agentSteps: [...AGENT_DIAGNOSE_STEPS],
      }
    },
  },
  {
    id: 'budget',
    keywords: ['budget', 'compare', 'options within', 'cheapest', 'cost', 'afford', 'planner', 'treatment'],
    answer: (ctx) => {
      const conditionId = ctx.latest?.result.conditionId
      const meta = conditionId ? conditionById(conditionId) : undefined
      const ranked = rankTreatmentOptions(conditionId, ctx.budget ?? 600)
      const lines = ranked
        .slice(0, 3)
        .map(
          (r, i) =>
            `${i + 1}. ${r.option.name} — ${formatCompactINR((r.option.costMin + r.option.costMax) / 2)}/acre indicative band${r.withinBudget ? '' : ' (above your budget)'}; ${r.rationale}`,
        )
      return {
        content: meta
          ? `For ${meta.shortName}, with a ${formatCompactINR(ctx.budget ?? 600)}/acre budget, the top indicative options are:\n${lines.join('\n')}`
          : `With a ${formatCompactINR(ctx.budget ?? 600)}/acre budget, indicative options generally start with low-cost cultural practices first: scouting checks, affected-leaf removal, dry-leaf irrigation timing. Cheaper is only "better" when the option actually suits the condition — suitability is weighted before affordability in the ranking.`,
        related: [
          { label: 'Open treatment planner', to: '/app/treatments' },
          ...(ctx.latest ? [{ label: 'Open explainable results', to: `/app/explanations?analysis=${ctx.latest.result.id}` }] : []),
        ],
        contextCards: ctx.latest ? diagnosisContext(ctx.latest.result) : [{ title: 'Condition', value: 'Not selected yet', meta: 'Awaiting first assessment' } as { title: string; value: string; meta?: string }],
        agentSteps: [...AGENT_TREATMENT_STEPS],
      }
    },
  },
  {
    id: 'community',
    keywords: ['community', 'alert', 'region', 'warning', 'outbreak', 'reports', 'nearby', 'sample community'],
    answer: () => {
      const north = summarize('north', 'tomato', 'leaf-brown-spots')
      return {
        content: `In the starter dataset, North District dark-spot reports on tomato have been trending upward over the last four weeks (${north.recent} reports vs ${north.prior} in the prior eight). It is flagged at "attention" level. Important: a rise in reports suggests increased activity — it is not a confirmed outbreak. River Belt yellowing on rice and River Belt potato water-soaked reports sit at "watch" level.`,
        related: [{ label: 'Open community early-warning centre', to: '/app/community?region=north&crop=tomato' }],
        agentSteps: [...AGENT_COMMUNITY_STEPS],
      }
    },
  },
  {
    id: 'evidence',
    keywords: ['evidence', 'source', 'recommendation', 'proof', 'safe', 'label'],
    answer: () => ({
      content:
        'Options carry evidence tiers, not live citations: some read "grade A (structure)", some "limited", and some read "Evidence unavailable". Nothing effectiveness or dosage-related is invented here. When the backend connects, recommendations will map to verified extension advisories and printed labels before any ranking is shown.',
      related: [{ label: 'See research & trust', to: '/research' }],
      agentSteps: [...AGENT_TREATMENT_STEPS],
    }),
  },
  {
    id: 'agent',
    keywords: ['agent', 'workflow', 'how do you work', 'orchestrat', 'tools'],
    answer: () => ({
      content:
        'The assistant traces a planned architecture: a main orchestrator coordinates four capabilities — agricultural knowledge gathering, crop analysis (the future ML + XAI hook), cost-aware treatment ranking, and community early-warning. Today they run locally with deterministic logic; the agent activity panel shows exactly which capability handles each answer.',
      related: [{ label: 'See the architecture overview', to: '/research' }],
      agentSteps: [...AGENT_DIAGNOSE_STEPS],
    }),
  },
  {
    id: 'hello',
    keywords: ['hi', 'hello', 'hey', 'namaste', 'start'],
    answer: () => ({
      content:
        'Hello! I am the AgrowNex assistant. I can walk through a diagnosis, explain a prediction, compare treatments inside a budget, or summarise community reports. What would you like to start with?',
    }),
  },
]

function rankTreatmentOptions(conditionId: string | undefined, budget: number): RankedTreatment[] {
  const options = conditionId && conditionById(conditionId) ? conditionById(conditionId)!.treatmentIds : []
  const opts: TreatmentOption[] = (options.length ? options : ['scout-followup', 'watering-tune'])
    .map((id) => TREATMENTS.find((t) => t.id === id))
    .filter((t): t is TreatmentOption => Boolean(t))
  return rankTreatments(opts, conditionId ?? 'generic-stress', budget)
}

function summarize(regionId: string, cropId: string, symptomId: string) {
  const series = getSeries(regionId, cropId, symptomId)
  const recent = series.slice(-4).reduce((s, p) => s + p.count, 0)
  const prior = series.slice(0, -4).reduce((s, p) => s + p.count, 0)
  return { recent, prior }
}

const FALLBACK: AssistantReply = {
  content:
    'I support a few question types: crop symptoms, "explain why this prediction", "compare options within my budget", community alerts for a region, and the evidence behind recommendations. Try one of the suggestion chips below — each answer cites how it was produced.',
}

export function respond(question: string, ctx: AssistantContextInput): AssistantReply {
  const q = question.toLowerCase()
  const intent = INTENTS.find((i) => i.keywords.some((k) => q.includes(k)))
  const reply = intent ? intent.answer(ctx) : FALLBACK
  return reply
}

export async function respondAsync(question: string, ctx: AssistantContextInput): Promise<AssistantReply> {
  await delay(null, 900)
  return respond(question, ctx)
}

/**
 * Backend-backed orchestration (§10.7). Tries the real Express orchestrator
 * first (tool-running agent with safety review); on any failure falls back to
 * the local rule-based composer and labels which engine answered via the
 * `provider` field — nothing pretends to be an LLM.
 */
export async function respondWithBackend(
  question: string,
  ctx: AssistantContextInput & { regionId?: string },
): Promise<AssistantReply & { provider: string; conversationId: string }> {
  try {
    const res = await sendAssistantMessage({
      message: question,
      cropId: ctx.latest?.result.input.cropId,
      regionId: ctx.regionId,
      budget: ctx.budget,
    })
    return {
      content: res.message.content,
      related: res.message.related,
      contextCards: res.message.contextCards,
      agentSteps: res.message.agentSteps.map((s) => ({ id: s.id, label: s.label, detail: s.detail, capability: s.capability })),
      provider: res.message.provider,
      conversationId: res.conversationId,
    }
  } catch (err) {
    console.warn('[assistant] backend orchestrator unreachable — using local composer:', err)
    const local = await respondAsync(question, ctx)
    return { ...local, provider: 'local-composer', conversationId: '' }
  }
}

export const SUGGESTED_PROMPTS = [
  'Help me understand these crop symptoms',
  'Explain why this prediction was made',
  'Compare suitable options within my budget',
  'Show me the community alerts',
  'Explain the evidence behind this recommendation',
]

export function communityFilterDefaults(): { region: string; symptom: string } {
  return { region: regionName('north'), symptom: SYMPTOM_FILTERS[0].label }
}

export type { CropAnalysisInput }

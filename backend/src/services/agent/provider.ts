import { env } from '../../config/env.js'
import { logger } from '../../utils/logger.js'

/**
 * Provider abstraction (§10.7): one interface, two implementations.
 * - A configured OpenAI-compatible provider, when env keys exist.
 * - A deterministic rule-based fallback so the core app never needs a paid API.
 * Responses must state which provider produced them; fallback mode is never
 * presented as a real LLM.
 */

export interface ProviderResult {
  provider: string
  mode: 'llm' | 'deterministic-fallback'
  text: string
}

export interface ProviderPromptContext {
  /** tool outputs (already validated/grounded) the response must be built from */
  facts: string[]
  userQuestion: string
  uncertaintyNotice: string
}

export function llmConfigured(): boolean {
  return (
    env.LLM_PROVIDER === 'openai-compatible' &&
    Boolean(env.LLM_API_KEY) &&
    Boolean(env.LLM_BASE_URL)
  )
}

async function callOpenAiCompatible(ctx: ProviderPromptContext, timeoutMs = env.LLM_TIMEOUT_MS): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are the Agrownex agricultural assistant. Answer ONLY from the FACTS provided by tools. ' +
              'You must include the UNCERTAINTY notice verbatim. Never invent treatments, dosages, prices, outbreak claims or citations. ' +
              'If facts are insufficient, say exactly what information is missing.',
          },
          {
            role: 'user',
            content:
              `QUESTION: ${ctx.userQuestion}\n\nFACTS (tool outputs):\n${ctx.facts.map((f) => '- ' + f).join('\n')}\n\nMANDATORY UNCERTAINTY NOTICE: ${ctx.uncertaintyNotice}\n\nCompose a short, plain answer grounded only in these facts.`,
          },
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`LLM provider ${res.status} ${res.statusText} ${detail.slice(0, 200)}`)
    }
    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = payload.choices?.[0]?.message?.content
    if (!text) throw new Error('LLM provider returned no message content')
    return text
  } finally {
    clearTimeout(timer)
  }
}

/** Deterministic fallback: rule-composed answer strictly from tool facts. */
export function deterministicCompose(ctx: ProviderPromptContext, mode: 'diagnosis' | 'treatment' | 'community' | 'knowledge' | 'general'): ProviderResult {
  const lead: Record<typeof mode, string> = {
    diagnosis: 'Here is what the analysis tool returned for your crop question:',
    treatment: 'Here are the treatment options the ranking engine returned:',
    community: 'Here is what the community monitoring tool reports:',
    knowledge: 'From the curated knowledge collection:',
    general: 'Here is what I found using the demo tools:',
  }
  return {
    provider: 'deterministic-fallback',
    mode: 'deterministic-fallback',
    text: [
      lead[mode],
      '',
      ...ctx.facts.map((f) => `• ${f}`),
      '',
      ctx.uncertaintyNotice,
      llmConfigured() ? 'Provider note: an LLM is configured but this response came from the deterministic composer.' : 'Provider note: no LLM provider is configured, so this rule-based composer answered using the same tool outputs.',
    ].join('\n'),
  }
}

export async function generateAnswer(ctx: ProviderPromptContext, mode: 'diagnosis' | 'treatment' | 'community' | 'knowledge' | 'general'): Promise<ProviderResult> {
  if (llmConfigured()) {
    try {
      const text = await callOpenAiCompatible(ctx)
      return { provider: `openai-compatible:${env.LLM_MODEL}`, mode: 'llm', text: appendMode(text, ctx) }
    } catch (err) {
      logger.warn('LLM provider failed; falling back to deterministic composer', { message: err instanceof Error ? err.message : String(err) })
    }
  }
  return deterministicCompose(ctx, mode)
}

function appendMode(text: string, ctx: ProviderPromptContext): string {
  return text.includes(ctx.uncertaintyNotice) ? text : `${text}\n\n${ctx.uncertaintyNotice}`
}

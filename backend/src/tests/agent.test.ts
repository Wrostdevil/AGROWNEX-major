import { afterEach, describe, expect, it, vi } from 'vitest'
import { orchestrate } from '../services/agent/orchestrator.js'
import { validateResponse } from '../services/agent/safety.js'

/**
 * Agent tests (§10.8, software-level): tool selection, grounding, safety.
 * These run in fallback mode — no LLM, no MongoDB (bundled curated records),
 * no ML service. Database/ML-dependent paths are exercised in the integration
 * smoke script and documented as blocked when dependencies are unavailable.
 */

describe('orchestrator (deterministic fallback)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('routes treatment questions to the treatment-ranking tool first', async () => {
    const res = await orchestrate({ question: 'What treatment options do I have under 500 INR?', context: { cropping: { budget: 500 } } })
    expect(res.toolTraces[0].tool).toBe('treatment-ranking')
    expect(res.toolTraces[0].status).toBe('done')
    expect(res.steps.some((s) => s.capability.includes('Treatment'))).toBe(true)
    expect(res.contextCards.some((c) => c.title.includes('Budget'))).toBe(true)
    const budgetCard = res.contextCards.find((c) => c.title.includes('Budget'))
    expect(budgetCard?.value).toContain('500')
  })

  it('routes community questions to community-monitor and reports honest unavailability without the DB', async () => {
    const res = await orchestrate({ question: 'Any disease trend in my region? village reports about spread', context: { cropping: { regionId: 'river' } } })
    expect(res.toolTraces[0].tool).toBe('community-monitor')
    const trace = res.toolTraces[0]
    expect(['unavailable', 'done']).toContain(trace.status)
    if (trace.status === 'unavailable') {
      expect(trace.detail).toMatch(/community storage unavailable/i)
    }
  })

  it('tells the truth when no diagnosis exists: crop-analysis is unavailable, not invented', async () => {
    const res = await orchestrate({ question: 'Explain my last diagnosis and model confidence', context: {} })
    const trace = res.toolTraces.find((t) => t.tool === 'crop-analysis')
    // without the DB (and without any stored analysis) the tool must be
    // unavailable with an honest message — never a fabricated prediction
    expect(trace?.status).toBe('unavailable')
    expect(trace?.detail).toMatch(/diagnosis first/i)
  })

  it('names the provider honestly as deterministic-fallback when no LLM is configured', async () => {
    const res = await orchestrate({ question: 'treatment options', context: {} })
    expect(res.provider).toBe('deterministic-fallback')
    expect(res.content).toMatch(/rule-based composer|deterministic/i)
  })

  it('grounds the composed answer in actual tool outputs', async () => {
    const res = await orchestrate({ question: 'cheap treatment plan options', context: { cropping: { budget: 300 } } })
    // the ranking facts must appear in the reply text (grounded, not invented)
    expect(res.content).toMatch(/Ranking engine \(budget 300/)
    expect(res.content).toMatch(/sample options/)
  })
})

describe('safety review', () => {
  const notice = 'Reminder: sample data; nothing here is a confirmed outbreak or a certified diagnosis.'

  it('blocks responses that lack uncertainty notices', () => {
    const findings = validateResponse('Spray 500 ml per acre to cure it.', { groundedToolCount: 0, mode: 'llm' })
    expect(findings.some((f) => f.rule === 'uncertainty-notice' && f.severity === 'block')).toBe(true)
  })

  it('blocks outbreak-confirming and guaranteed-cure language', () => {
    const findings = validateResponse(`There is a confirmed outbreak. ${notice}`, { groundedToolCount: 1, mode: 'llm' })
    expect(findings.some((f) => f.rule === 'no-overclaim' && f.severity === 'block')).toBe(true)
  })

  it('blocks dosage-style advice', () => {
    const findings = validateResponse(`Spray 250 ml per acre of product X. ${notice}`, { groundedToolCount: 1, mode: 'llm' })
    expect(findings.some((f) => f.rule === 'no-dosage' && f.severity === 'block')).toBe(true)
  })

  it('warns when the response is not grounded in tool output', () => {
    const findings = validateResponse(`Some general prose reply without tools. ${notice}`, { groundedToolCount: 0, mode: 'deterministic-fallback' })
    expect(findings.some((f) => f.rule === 'grounding' && f.severity === 'warn')).toBe(true)
  })
})

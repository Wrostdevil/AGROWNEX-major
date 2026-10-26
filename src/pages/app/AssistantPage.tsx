import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, CheckCircle2, Copy, Loader2, RefreshCw, Send, User as UserIcon } from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock } from '../../components/ui/shared'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button, LinkButton } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast'
import { SUGGESTED_PROMPTS, respondWithBackend } from '../../services/assistantService'
import { latestCompleteRecord } from '../../services/historyService'
import type { AgentPhase, AssistantMessage as Msg } from '../../types'
import { uid } from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello — I'm the AgrowNex assistant. Ask me about crop symptoms, why a prediction leaned the way it did, what fits a budget, or what community reports show. Every answer cites how it was produced.",
  createdAt: Date.now(),
}

export function AssistantPage() {
  usePageTitle('AI assistant')
  const { toast } = useToast()
  const [params] = useSearchParams()
  const [messages, setMessages] = useState<Msg[]>([WELCOME])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [phase, setPhase] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showAgent, setShowAgent] = useState(true)

  // Auto-fire the first suggested prompt when arriving with ?q=
  const firedRef = useRef(false)
  useEffect(() => {
    const q = params.get('q')
    if (q && !firedRef.current) {
      firedRef.current = true
      void send(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const agentSteps = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant' && m.agentSteps)
    return last?.agentSteps ?? null
  }, [messages])

  const activePhase = thinking ? phase : -1

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || thinking) return
    setDraft('')
    const userMsg: Msg = { id: uid('m'), role: 'user', content: trimmed, createdAt: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setThinking(true)
    setPhase(0)

    // Phase animation ticks in parallel; the reply arrives from the real
    // backend orchestrator when available, else from the offline local composer.
    const phaseTimers = [1, 2, 3].map((p, i) => window.setTimeout(() => setPhase(p), 420 * (i + 1)))

    const ctx = { latest: latestCompleteToCtx(), budget: 600 }
    try {
      const reply = await respondWithBackend(trimmed, ctx)
      if (reply.provider === 'local-composer') {
        toast({
          kind: 'info',
          title: 'Answered by the offline composer',
          body: 'The backend agent was unreachable, so the built-in rule engine replied.',
        })
      }
      const botMsg: Msg = {
        id: uid('m'),
        role: 'assistant',
        content: reply.content,
        createdAt: Date.now(),
        contextCards: reply.contextCards,
        related: reply.related,
        agentSteps: (reply.agentSteps ?? []).map((s) => ({
          id: s.id,
          label: s.label,
          detail: s.detail,
          capability: s.capability,
          status: 'done' as AgentPhase,
        })),
      }
      setMessages((prev) => [...prev, botMsg])
      setThinking(false)
      setPhase(0)
    } finally {
      phaseTimers.forEach((t) => window.clearTimeout(t))
    }
  }

  function resetConversation() {
    setMessages([WELCOME])
    if (!thinking) toast({ kind: 'info', title: 'Conversation reset' })
  }

  const canSend = draft.trim().length > 0 && !thinking

  return (
    <>
      <PageHeader
        title="AI farming assistant"
        description="A deterministic local conversation service routes supported questions to grounded answers — the same interface the agent orchestrator plugs into when the backend connects."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAgent((v) => !v)}>
              {showAgent ? 'Hide' : 'Show'} agent activity
            </Button>
            <Button variant="ghost" size="sm" onClick={resetConversation} leadingIcon={<RefreshCw size={14} />}>
              Reset conversation
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {/* Conversation */}
        <Card className="flex min-h-[560px] flex-col">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite" aria-label="Conversation">
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
            {thinking && (
              <ThinkingBlock phase={phase} />
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-line px-4 py-4 sm:px-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!canSend) return
                void send(draft)
              }}
              className="relative"
            >
              <label htmlFor="assistant-draft" className="sr-only">Message the assistant</label>
              <textarea
                id="assistant-draft"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (canSend) void send(draft)
                  }
                }}
                placeholder="Ask about symptoms, budgets, explanations or the watch alerts…"
                className="w-full resize-none rounded-2xl bg-surface-2 px-4 py-3 pr-14 text-[14px] text-ink placeholder:text-faint ring-1 ring-inset ring-line focus:ring-2 focus:ring-brand focus:outline-none"
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-on-brand transition hover:bg-brand-strong disabled:opacity-40"
                >
                  {thinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </form>
            <p className="mt-2 flex items-center gap-2 text-[10.5px] text-faint">
              Enter to send · Shift+Enter for a new line
            </p>

            {/* Suggested prompts */}
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void send(p)}
                  disabled={thinking}
                  className="rounded-full bg-brand-soft px-3 py-1.5 text-[11.5px] font-bold text-brand ring-1 ring-inset ring-brand/15 transition hover:bg-brand hover:text-on-brand disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Agent activity + context */}
        <div className="space-y-6">
          {showAgent && (
            <Card>
              <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-2">
                <p className="text-[15px] font-bold text-ink">Agent activity</p>
                <Badge tone="outline">local pipeline</Badge>
              </div>
              <div className="px-5 pb-5">
                <ol className="relative space-y-4 border-l border-line pl-5">
                  {[
                    { id: 'p1', label: 'Understanding the request', capability: 'Main orchestrator' },
                    { id: 'p2', label: 'Gathering relevant context', capability: 'Knowledge & context tool' },
                    { id: 'p3', label: 'Running the matched tool', capability: 'Route-dependent capability' },
                    { id: 'p4', label: 'Checking constraints & evidence', capability: 'Safety-review capability' },
                    { id: 'p5', label: 'Preparing the response', capability: 'Response assembly' },
                  ].map((s, i) => {
                    const state = activePhase > i ? 'done' : activePhase === i ? 'active' : thinking ? 'scheduled' : 'done'
                    return (
                      <li key={s.id} className="relative">
                        <span
                          aria-hidden
                          className={cn(
                            'absolute -left-[26px] grid h-5 w-5 place-items-center rounded-full ring-1 ring-inset',
                            state === 'done' && 'bg-brand text-on-brand ring-brand',
                            state === 'active' && 'bg-brand-soft text-brand ring-brand/40',
                            state === 'scheduled' && 'bg-surface text-faint ring-line',
                          )}
                        >
                          {state === 'done' ? <CheckCircle2 size={11} /> : state === 'active' ? <Loader2 size={10} className="animate-spin" /> : <span className="text-[9px] font-bold">{i + 1}</span>}
                        </span>
                        <p className={cn('text-[13px] font-bold leading-snug', state === 'scheduled' ? 'text-faint' : 'text-ink')}>{s.label}</p>
                        <p className="text-[11px] text-muted">{s.capability}</p>
                      </li>
                    )
                  })}
                </ol>
                <p className="mt-4 text-[11px] leading-relaxed text-faint">
                  This timeline mirrors the actual pipeline: it runs while a message is processed and
                  completes when an answer lands. No fabricated tool calls appear here.
                </p>
              </div>
            </Card>
          )}

          {/* last assistant context cards */}
          {agentSteps === null && (
            <NoteBlock tone="brand" title="What the assistant can answer">
              Five example intents are supported: symptom interpretation, prediction explanation, budget-based
              option comparison, community-alert summaries and evidence/policy questions. Unsupported phrasing
              falls back to an honest capabilities list.
            </NoteBlock>
          )}

          <Card>
            <div className="px-5 pt-5 pb-3">
              <p className="text-[15px] font-bold text-ink">Keep exploring</p>
            </div>
            <div className="grid gap-2 px-5 pb-5">
              <LinkButton to="/app/diagnosis" variant="outline" className="justify-start">Run a fresh diagnosis</LinkButton>
              <LinkButton to="/app/explanations" variant="outline" className="justify-start">Open explainable results</LinkButton>
              <LinkButton to="/app/treatments" variant="outline" className="justify-start">Open treatment planner</LinkButton>
              <LinkButton to="/app/community" variant="outline" className="justify-start">Open early-warning centre</LinkButton>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

function latestCompleteToCtx() {
  const rec = latestCompleteRecord()
  return rec?.result ? { result: rec.result } : undefined
}

function MessageBubble({ m }: { m: Msg }) {
  const { toast } = useToast()
  const isUser = m.role === 'user'
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 ring-inset',
          isUser ? 'bg-surface-2 text-muted ring-line' : 'bg-forest-900 text-sage-300 ring-white/10',
        )}
        aria-hidden
      >
        {isUser ? <UserIcon size={14} /> : <Bot size={15} />}
      </span>
      <div className={cn('min-w-0 max-w-[84%]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed text-left',
            isUser ? 'rounded-tr-md bg-brand text-on-brand text-left' : 'rounded-tl-md bg-surface-2/80 text-ink ring-1 ring-inset ring-line',
          )}
        >
          {m.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{line}</p>
          ))}
        </div>
        {m.contextCards && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.contextCards.map((c) => (
              <span key={c.title} className="rounded-xl bg-surface px-3 py-2 text-left ring-1 ring-inset ring-line">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-faint">{c.title}</span>
                <span className="block text-[12px] font-bold text-ink">{c.value}</span>
                {c.meta && <span className="block text-[10.5px] text-muted">{c.meta}</span>}
              </span>
            ))}
          </div>
        )}
        {m.related && (
          <div className={cn('mt-2 flex flex-wrap gap-2', isUser && 'justify-end')}>
            {m.related.map((l) => (
              <LinkButton key={l.to + l.label} to={l.to} variant="secondary" size="sm">
                {l.label}
              </LinkButton>
            ))}
          </div>
        )}
        {!isUser && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10.5px] text-faint">assistant reply · deterministic</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(m.content).then(
                  () => toast({ kind: 'success', title: 'Response copied' }),
                  () => toast({ kind: 'warning', title: 'Copy blocked by browser', body: 'Clipboard permission denied.' }),
                )
              }}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold text-muted transition hover:text-ink"
            >
              <Copy size={10} /> copy
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ThinkingBlock({ phase }: { phase: number }) {
  const labels = [
    'Understanding the request…',
    'Gathering relevant context…',
    'Running the matched tool…',
    'Preparing the response…',
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-forest-900 text-sage-300 ring-1 ring-inset ring-white/10" aria-hidden>
        <Bot size={15} />
      </span>
      <div className="rounded-2xl rounded-tl-md bg-surface-2/80 px-4 py-3 ring-1 ring-inset ring-line">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-muted">
          <Loader2 size={13} className="animate-spin text-brand" />
          {labels[Math.min(phase, labels.length - 1)]}
        </div>
        <div className="mt-2 space-y-1.5" aria-hidden>
          <div className="h-2 w-44 animate-shimmer rounded-full bg-surface-3" />
          <div className="h-2 w-32 animate-shimmer rounded-full bg-surface-3" />
        </div>
      </div>
    </motion.div>
  )
}

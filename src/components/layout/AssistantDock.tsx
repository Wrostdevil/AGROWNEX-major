import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownRight, Loader2, Send, X, User as UserIcon } from 'lucide-react'
import { AgentOrb } from '../ui/AgentOrb'
import { LinkButton } from '../ui/Button'
import { SUGGESTED_PROMPTS, respondWithBackend } from '../../services/assistantService'
import { latestCompleteRecord } from '../../services/historyService'
import { useToast } from '../ui/toast'
import type { AssistantMessage as Msg } from '../../types'
import { uid, cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

/**
 * AssistantDock — the bottom-left floating AI chat.
 *
 * Clicking the dock button opens a live conversation panel in place: the same
 * backend orchestrator (or offline local composer) that powers the assistant
 * workspace page answers here, so the workspace stays one click from help.
 */
export function AssistantDock() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([WELCOME])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [phase, setPhase] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  // Escape closes and returns focus to the dock button.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        fabRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking, open])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || thinking) return
    setDraft('')
    const userMsg: Msg = { id: uid('m'), role: 'user', content: trimmed, createdAt: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setThinking(true)
    setPhase(0)

    const phaseTimers = [1, 2, 3].map((p, i) => window.setTimeout(() => setPhase(p), 420 * (i + 1)))

    const rec = latestCompleteRecord()
    const ctx = { latest: rec?.result ? { result: rec.result } : undefined, budget: 600 }
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
      }
      setMessages((prev) => [...prev, botMsg])
      setThinking(false)
      setPhase(0)
    } catch {
      setThinking(false)
      setPhase(0)
      toast({ kind: 'warning', title: 'Assistant failed', body: 'The reply did not arrive — please try again.' })
    } finally {
      phaseTimers.forEach((t) => window.clearTimeout(t))
    }
  }

  const canSend = draft.trim().length > 0 && !thinking
  const showSuggestions = messages.length === 1 && !thinking

  return (
    <div className="fixed z-40 print:hidden [bottom:calc(1.25rem+env(safe-area-inset-bottom))] [right:calc(1rem+env(safe-area-inset-right))] sm:[bottom:calc(1.5rem+env(safe-area-inset-bottom))] sm:[right:calc(1.25rem+env(safe-area-inset-right))]">
      {/* Click-outside catcher (lowest layer inside this stacking context) */}
      {open && <div className="fixed inset-0 -z-10 cursor-default" onClick={() => setOpen(false)} aria-hidden />}

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Assistant chat"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease }}
            className="absolute bottom-[calc(100%+12px)] right-0 flex h-[min(72dvh,540px)] w-[min(92vw,370px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-lift ring-1 ring-inset ring-line"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-line bg-surface-2/60 px-4 py-3">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-forest-900 text-sage-300 ring-1 ring-inset ring-white/10"
                aria-hidden
              >
                <AgentOrb size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-ink">AgrowNex assistant</p>
                <p className="text-[10.5px] font-semibold text-faint">{thinking ? 'Thinking…' : 'Ask anything about your crops'}</p>
              </div>
              <LinkButton
                to="/app/assistant"
                variant="ghost"
                size="sm"
                className="px-2"
                aria-label="Open the full assistant workspace page"
                onClick={() => setOpen(false)}
              >
                <CornerDownRight size={13} />
              </LinkButton>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant chat"
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conversation */}
            <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m) => (
                <DockBubble key={m.id} m={m} />
              ))}
              {thinking && <DockThinking phase={phase} />}
            </div>

            {/* Suggested prompts — only before the first real exchange */}
            {showSuggestions && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-2.5">
                {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void send(p)}
                    className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-bold text-brand ring-1 ring-inset ring-brand/15 transition hover:bg-brand hover:text-on-brand"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-line px-3 pb-3 pt-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!canSend) return
                  void send(draft)
                }}
                className="relative"
              >
                <label htmlFor="assistant-dock-draft" className="sr-only">Message the assistant</label>
                <textarea
                  id="assistant-dock-draft"
                  rows={2}
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (canSend) void send(draft)
                    }
                  }}
                  placeholder="Ask about symptoms, budgets, explanations…"
                  className="w-full resize-none rounded-xl bg-surface-2 px-3.5 py-2.5 pr-11 text-[13px] text-ink placeholder:text-faint ring-1 ring-inset ring-line focus:ring-2 focus:ring-brand focus:outline-none"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg bg-brand text-on-brand transition hover:bg-brand-strong disabled:opacity-40"
                >
                  {thinking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </form>
              <p className="mt-1.5 text-[10px] text-faint">Enter to send · Shift+Enter for a new line</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock button — 3D agent orb */}
      <button
        ref={fabRef}
        type="button"
        aria-label={open ? 'Close assistant chat' : 'Open assistant chat'}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={open ? 'Close assistant chat' : 'Ask the AI assistant'}
        onClick={() => setOpen((v) => !v)}
        className="relative isolate grid h-13 w-13 place-items-center rounded-full bg-[radial-gradient(125%_125%_at_30%_22%,#41A97A_0%,#267A56_38%,#17523C_78%,#0E3B2C_100%)] shadow-[0_18px_32px_-10px_rgb(23_82_60/0.65),0_5px_12px_-4px_rgb(23_82_60/0.5),inset_0_1px_1px_rgb(255_255_255/0.30),inset_0_-12px_18px_-10px_rgb(6_22_17/0.65),inset_0_0_0_1px_rgb(255_255_255/0.07)] ring-1 ring-inset ring-brand-strong/45 transition-transform duration-200 hover:scale-[1.06] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {/* attention halo (closed state only) */}
        {!open && <span aria-hidden className="absolute inset-0 -z-10 rounded-full animate-agent-halo" />}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ opacity: 0, rotate: -90, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.6 }} transition={{ duration: 0.16 }} className="absolute inset-0 grid place-items-center text-on-brand" aria-hidden>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="orb" initial={{ opacity: 0, y: 12, scale: 0.55 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.55 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 grid place-items-center" aria-hidden>
              <span className="animate-agent-float grid place-items-center">
                <AgentOrb size={36} />
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}

const WELCOME: Msg = {
  id: 'dock-welcome',
  role: 'assistant',
  content:
    "I'm the AgrowNex assistant. Ask about crop symptoms, why a prediction leaned the way it did, what fits a budget, or what community reports show.",
  createdAt: Date.now(),
}

function DockBubble({ m }: { m: Msg }) {
  const isUser = m.role === 'user'
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease }} className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ring-inset',
          isUser ? 'bg-surface-2 text-muted ring-line' : 'bg-forest-900 text-sage-300 ring-white/10',
        )}
        aria-hidden
      >
        {isUser ? <UserIcon size={13} /> : <AgentOrb size={14} />}
      </span>
      <div className={cn('min-w-0 max-w-[82%]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed text-left',
            isUser ? 'rounded-tr-md bg-brand text-on-brand' : 'rounded-tl-md bg-surface-2/80 text-ink ring-1 ring-inset ring-line',
          )}
        >
          {m.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{line}</p>
          ))}
        </div>
        {m.contextCards && m.contextCards.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.contextCards.slice(0, 3).map((c) => (
              <span key={c.title} className="rounded-lg bg-surface px-2.5 py-1.5 text-left ring-1 ring-inset ring-line">
                <span className="block text-[9.5px] font-bold uppercase tracking-wide text-faint">{c.title}</span>
                <span className="block text-[11.5px] font-bold text-ink">{c.value}</span>
              </span>
            ))}
          </div>
        )}
        {m.related && m.related.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.related.slice(0, 2).map((l) => (
              <LinkButton key={l.to + l.label} to={l.to} variant="secondary" size="sm" className="px-2.5 py-1 text-[11px]">
                {l.label}
              </LinkButton>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DockThinking({ phase }: { phase: number }) {
  const labels = [
    'Understanding the request…',
    'Gathering relevant context…',
    'Running the matched tool…',
    'Preparing the response…',
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-forest-900 text-sage-300 ring-1 ring-inset ring-white/10" aria-hidden>
        <AgentOrb size={14} />
      </span>
      <div className="rounded-2xl rounded-tl-md bg-surface-2/80 px-3.5 py-2.5 ring-1 ring-inset ring-line">
        <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted">
          <Loader2 size={12} className="animate-spin text-brand" />
          {labels[Math.min(phase, labels.length - 1)]}
        </div>
        <div className="mt-1.5 space-y-1.5" aria-hidden>
          <div className="h-2 w-40 animate-shimmer rounded-full bg-surface-3" />
          <div className="h-2 w-28 animate-shimmer rounded-full bg-surface-3" />
        </div>
      </div>
    </motion.div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, CornerDownRight, X } from 'lucide-react'
import { LinkButton } from '../ui/Button'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

/**
 * AssistantDock — the bottom-left home for the upcoming AI assistant chat.
 *
 * This build ships the docked spot as an honest placeholder: the floating
 * conversation widget is on the product roadmap, not wired up yet, so the
 * button states that openly and links to the full assistant workspace page
 * that already works today.
 */
export function AssistantDock() {
  const [open, setOpen] = useState(false)
  const fabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        fabRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="fixed bottom-5 left-4 z-40 sm:bottom-6 sm:left-5 print:hidden">
      {/* Click-outside catcher (lowest layer inside this stacking context) */}
      {open && <div className="fixed inset-0 -z-10 cursor-default" onClick={() => setOpen(false)} aria-hidden />}

      {/* Announcement card */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Assistant dock status"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
            className="absolute bottom-[calc(100%+12px)] left-0 w-[min(88vw,320px)] rounded-2xl bg-surface p-4 shadow-lift ring-1 ring-inset ring-line"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand ring-1 ring-inset ring-brand/20"
                  aria-hidden
                >
                  <Bot size={15} />
                </span>
                <p className="text-[13.5px] font-bold text-ink">AI chat docks here</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close announcement"
                className="rounded-lg p-1 text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              The floating assistant conversation opens from this corner in a coming update — voice
              replies are on the roadmap. The full assistant already works on its workspace page on
              this device.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LinkButton to="/app/assistant" size="sm" trailingIcon={<CornerDownRight size={13} />}>
                Open the assistant now
              </LinkButton>
              <span className="rounded-full bg-dawn px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-caution ring-1 ring-inset ring-caution/25">
                Coming soon
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docked spot (the icon itself) */}
      <button
        ref={fabRef}
        type="button"
        aria-label={open ? 'Close assistant dock status' : 'Assistant dock — opens announcement, chat arrives in a future update'}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="AI assistant — docking here soon"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-13 w-13 place-items-center rounded-full bg-brand text-on-brand shadow-lift ring-1 ring-inset ring-brand-strong/40 transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Bot size={22} aria-hidden />
        <span
          aria-hidden
          className="absolute -top-1 -right-1 rounded-full bg-dawn px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-caution ring-1 ring-inset ring-caution/30"
        >
          soon
        </span>
      </button>
    </div>
  )
}

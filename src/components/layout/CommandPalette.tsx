import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  FlaskConical,
  History,
  LayoutDashboard,
  Lightbulb,
  Map,
  Moon,
  Radar,
  Search,
  Settings,
  Stethoscope,
  Sun,
  Trash2,
  Wallet,
  CornerDownLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils'
import { updatePreferences, usePreferences } from '../../services/preferences'
import { resetWorkspaceData } from '../../services/dataManagement'

interface Command {
  id: string
  label: string
  hint?: string
  group: 'Pages' | 'Actions'
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  keywords: string
  run: (navigate: (to: string) => void) => void
}

const COMMANDS: Command[] = [
  { id: 'c-overview', label: 'Go to Overview', group: 'Pages', icon: LayoutDashboard, keywords: 'dashboard home summary', run: (n) => n('/app') },
  { id: 'c-diagnosis', label: 'Start a crop diagnosis', group: 'Pages', icon: Stethoscope, keywords: 'assess symptoms sample upload', run: (n) => n('/app/diagnosis') },
  { id: 'c-explanations', label: 'Open explainable results', group: 'Pages', icon: Lightbulb, keywords: 'xai shap why importance', run: (n) => n('/app/explanations') },
  { id: 'c-treatments', label: 'Open treatment planner', group: 'Pages', icon: Wallet, keywords: 'cost budget compare options', run: (n) => n('/app/treatments') },
  { id: 'c-community', label: 'Open community early warning', group: 'Pages', icon: Radar, keywords: 'alerts reports region trend', run: (n) => n('/app/community') },
  { id: 'c-assistant', label: 'Open AI assistant', group: 'Pages', icon: Bot, keywords: 'chat ask question help', run: (n) => n('/app/assistant') },
  { id: 'c-fields', label: 'Go to fields & crops', group: 'Pages', icon: Map, keywords: 'profiles plots observations', run: (n) => n('/app/fields') },
  { id: 'c-history', label: 'Go to analysis history', group: 'Pages', icon: History, keywords: 'past records assessments', run: (n) => n('/app/history') },
  { id: 'c-evaluation', label: 'Open model evaluation', group: 'Pages', icon: FlaskConical, keywords: 'metrics planned experiments', run: (n) => n('/app/evaluation') },
  { id: 'c-settings', label: 'Go to settings', group: 'Pages', icon: Settings, keywords: 'preferences theme data', run: (n) => n('/app/settings') },
  {
    id: 'a-theme',
    label: 'Toggle light / dark theme',
    group: 'Actions',
    icon: Moon,
    keywords: 'dark light mode appearance',
    run: () => toggleTheme(),
  },
  {
    id: 'a-reset',
    label: 'Reset workspace data',
    group: 'Actions',
    icon: Trash2,
    keywords: 'clear wipe reset records starter',
    run: () => resetWorkspaceData(),
  },
]

function toggleTheme() {
  const current = readThemeFromStorage()
  updatePreferences({ theme: current === 'dark' ? 'light' : 'dark' })
}

// Command palette can run outside React render — read prefs imperatively.
function readThemeFromStorage(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem('agrownex.prefs.v1')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.theme === 'dark') return 'dark'
    }
  } catch {
    /* ignore */
  }
  return 'light'
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const prefs = usePreferences()

  // Reset state when (re)opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = COMMANDS.map((c) =>
      c.id === 'a-theme' ? { ...c, icon: prefs.theme === 'dark' ? Sun : Moon } : c,
    )
    if (!q) return list.slice(0, 9)
    return list.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q)).slice(0, 9)
  }, [query, prefs.theme])

  const runCommand = (cmd: Command) => {
    onClose()
    cmd.run((to) => navigate(to))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      runCommand(results[activeIndex])
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick navigation"
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-lift ring-1 ring-line"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search size={17} className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                placeholder="Search pages and actions…"
                aria-label="Search pages and actions"
                className="w-full bg-transparent text-[14px] text-ink placeholder:text-faint focus:outline-none"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold text-faint">ESC</kbd>
            </div>
            <ul role="listbox" aria-label="Results" className="max-h-[46vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-4 py-8 text-center text-[13px] text-muted">No matching pages or actions.</li>
              )}
              {results.map((cmd, i) => (
                <li key={cmd.id}>
                  <button
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => runCommand(cmd)}
                    onMouseMove={() => setActiveIndex(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors',
                      i === activeIndex ? 'bg-brand-soft' : 'hover:bg-surface-2',
                    )}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-brand ring-1 ring-inset ring-line">
                      <cmd.icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">{cmd.label}</span>
                      {cmd.hint && <span className="block truncate text-[11px] text-muted">{cmd.hint}</span>}
                    </span>
                    <span className="text-[11px] text-faint">{cmd.group}</span>
                    {i === activeIndex && <CornerDownLeft size={14} className="text-brand" />}
                  </button>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-4 py-2.5 text-[11px] text-faint">
              <kbd className="rounded border border-line px-1">↑</kbd>{' '}
              <kbd className="rounded border border-line px-1">↓</kbd> navigate ·{' '}
              <kbd className="rounded border border-line px-1">Enter</kbd> run ·{' '}
              <kbd className="rounded border border-line px-1">⌘</kbd>{'/'}
              <kbd className="rounded border border-line px-1">Ctrl+K</kbd> reopen
              <ArrowRight size={10} className="ml-1 inline" aria-hidden />
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Bot,
  ChevronRight,
  Download,
  FlaskConical,
  History,
  Info,
  LayoutDashboard,
  Lightbulb,
  Map,
  Menu,
  Moon,
  Radar,
  Search,
  Settings,
  Sprout,
  Stethoscope,
  Sun,
  Trash2,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../utils'
import { Logo, LogoMark } from './Logo'
import { CommandPalette } from './CommandPalette'
import { OnboardingModal } from './OnboardingModal'
import { AssistantDock } from './AssistantDock'
import { ConnectionBadge } from './ConnectionBadge'
import { useUnreadCount } from '../../services/notificationService'
import { displayName, initialsFor, updatePreferences, usePreferences } from '../../services/preferences'
import { exportWorkspaceData, resetWorkspaceData } from '../../services/dataManagement'
import { useCommandPaletteKey } from '../../hooks'

// ---------------------------------------------------------------------------
// Navigation model
// ---------------------------------------------------------------------------

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Optional badge tag, e.g. 'Lab' for evaluation-stage features. */
  badge?: string
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Workspace',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutDashboard },
      { to: '/app/diagnosis', label: 'Crop Diagnosis', icon: Stethoscope },
      { to: '/app/explanations', label: 'Explainable Results', icon: Lightbulb },
      { to: '/app/treatments', label: 'Treatment Planner', icon: Wallet },
      { to: '/app/community', label: 'Community Alerts', icon: Radar },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/app/assistant', label: 'AI Assistant', icon: Bot },
      { to: '/app/evaluation', label: 'Model Evaluation', icon: FlaskConical, badge: 'Lab' },
    ],
  },
  {
    title: 'Organise',
    items: [
      { to: '/app/fields', label: 'Fields & Crops', icon: Map },
      { to: '/app/history', label: 'Analysis History', icon: History },
      { to: '/app/notifications', label: 'Notifications', icon: Bell },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function navTitleForPath(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.to) return item.label
    }
  }
  if (pathname.startsWith('/app/diagnosis')) return 'Crop Diagnosis'
  if (pathname.startsWith('/app/explanations')) return 'Explainable Results'
  if (pathname.startsWith('/app/treatments')) return 'Treatment Planner'
  if (pathname.startsWith('/app/community')) return 'Community Alerts'
  if (pathname.startsWith('/app/assistant')) return 'AI Assistant'
  if (pathname.startsWith('/app/fields')) return 'Fields & Crops'
  if (pathname.startsWith('/app/history')) return 'Analysis History'
  if (pathname.startsWith('/app/notifications')) return 'Notifications'
  if (pathname.startsWith('/app/settings')) return 'Settings'
  return 'Overview'
}

function isActivePath(pathname: string, to: string) {
  if (to === '/app') return pathname === '/app'
  return pathname === to || pathname.startsWith(to + '/')
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const prefs = usePreferences()
  const unread = useUnreadCount()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  useCommandPaletteKey(() => setPaletteOpen(true))

  const isHome = location.pathname === '/app'
  const title = navTitleForPath(location.pathname)

  const onboardingOpen = prefs.onboardedAt === null

  const navList = useMemo(
    () => (
      <nav aria-label="Workspace sections" className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-faint">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActivePath(location.pathname, item.to)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors duration-150',
                        active ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface-2 hover:text-ink',
                      )}
                    >
                      <span aria-hidden className="relative grid place-items-center">
                        {active && (
                          <motion.span layoutId="nav-active-dot" className="absolute -left-1.5 h-5 w-1 rounded-full bg-brand" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                        )}
                        <item.icon size={17} className={active ? 'text-brand' : 'text-faint group-hover:text-muted'} />
                      </span>
                      {item.label}
                      {item.badge && <span className="ml-auto text-[9.5px] font-bold uppercase tracking-wide text-faint">{item.badge}</span>}
                      {item.to === '/app/notifications' && unread > 0 && (
                        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-on-brand" aria-label={`${unread} unread`}>
                          {unread}
                        </span>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    ),
    [location.pathname, unread],
  )

  return (
    <div className="flex min-h-dvh bg-canvas">
      <a href="#app-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand">
        Skip to content
      </a>

      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <Link to="/app" aria-label="AgrowNex workspace home" className="rounded-lg">
            <Logo />
          </Link>
        </div>
        {navList}
        <div className="border-t border-line p-3">
          <div className="rounded-xl bg-surface-2 px-3.5 py-3 ring-1 ring-inset ring-line">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-faint">
                <Info size={12} /> System status
              </div>
              <ConnectionBadge />
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              Your data stays on this device. When the analysis services are
              connected, their status appears above — if something is
              unavailable, the app tells you plainly instead of guessing.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-forest-950/50" onClick={() => setDrawerOpen(false)} aria-hidden />
            <motion.aside
              role="dialog"
              aria-label="Workspace navigation"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-surface shadow-lift"
            >
              <div className="flex items-center justify-between px-4 py-4">
                <Link to="/app" onClick={() => setDrawerOpen(false)} aria-label="Close drawer and go to overview">
                  <Logo />
                </Link>
                <button type="button" aria-label="Close navigation drawer" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-muted hover:bg-surface-2">
                  <X size={19} />
                </button>
              </div>
              {navList}
              <div className="border-t border-line p-3">
                <Link
                  to="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 py-2.5 text-[13px] font-semibold text-muted ring-1 ring-inset ring-line"
                >
                  <Sprout size={14} /> Back to public site
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation drawer"
              className="grid h-10 w-10 place-items-center rounded-xl text-ink ring-1 ring-inset ring-line lg:hidden"
            >
              <Menu size={19} />
            </button>

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-[13px] sm:flex">
              <Link to="/" className="rounded text-muted transition hover:text-ink">
                Home
              </Link>
              <ChevronRight size={13} className="text-faint" aria-hidden />
              <Link to="/app" className={cn('rounded', isHome ? 'font-semibold text-ink' : 'text-muted hover:text-ink')}>
                Workspace
              </Link>
              {!isHome && (
                <>
                  <ChevronRight size={13} className="text-faint" aria-hidden />
                  <span aria-current="page" className="rounded font-semibold text-ink">
                    {title}
                  </span>
                </>
              )}
            </nav>
            <span className="flex items-center gap-2 truncate text-[14px] font-bold sm:hidden">
              <LogoMark size={22} /> {title}
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden h-9 min-w-[190px] items-center gap-2 rounded-xl bg-surface-2 px-3 text-[13px] text-muted ring-1 ring-inset ring-line transition hover:text-ink md:flex"
              >
                <Search size={14} />
                <span>Quick navigation…</span>
                <kbd className="ml-auto rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open quick navigation (Command K)"
                className="grid h-10 w-10 place-items-center rounded-xl text-muted ring-1 ring-inset ring-line transition hover:text-ink md:hidden"
              >
                <Search size={17} />
              </button>

              <button
                type="button"
                onClick={() => updatePreferences({ theme: prefs.theme === 'dark' ? 'light' : 'dark' })}
                aria-label={prefs.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className="grid h-10 w-10 place-items-center rounded-xl text-muted ring-1 ring-inset ring-line transition hover:text-ink"
              >
                {prefs.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <Link
                to="/app/notifications"
                aria-label={`Notifications${unread ? ` — ${unread} unread` : ''}`}
                className="relative grid h-10 w-10 place-items-center rounded-xl text-muted ring-1 ring-inset ring-line transition hover:text-ink"
              >
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[9.5px] font-bold text-on-brand ring-2 ring-surface" aria-hidden>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-2 rounded-xl p-1 pr-2 ring-1 ring-inset ring-line transition hover:bg-surface-2"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest-800 text-[12px] font-bold text-sage-300">
                    {initialsFor(displayName(prefs))}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-[12.5px] font-semibold text-ink sm:block">
                    {displayName(prefs)}
                  </span>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden />
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-surface p-2 shadow-lift ring-1 ring-line"
                      >
                        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
                          <p className="truncate text-[13px] font-bold text-ink">{displayName(prefs)}</p>
                          <p className="text-[11px] text-muted">Local profile · stored on this device</p>
                        </div>
                        <div className="my-1.5 h-px bg-line" aria-hidden />
                        <button role="menuitem" onClick={() => { setProfileOpen(false); navigate('/app/settings') }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-2">
                          <Settings size={15} className="text-muted" /> Preferences
                        </button>
                        <button role="menuitem" onClick={() => { setProfileOpen(false); updatePreferences({ onboardedAt: null }) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-2">
                          <Info size={15} className="text-muted" /> Replay intro tour
                        </button>
                        <button role="menuitem" onClick={() => { setProfileOpen(false); exportWorkspaceData() }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-2">
                          <Download size={15} className="text-muted" /> Export data (JSON)
                        </button>
                        <button role="menuitem" onClick={() => { setProfileOpen(false); setResetConfirm(true) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-danger transition hover:bg-danger-soft">
                          <Trash2 size={15} /> Reset workspace data
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main id="app-main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <OnboardingModal open={onboardingOpen} />
      <ResetConfirmDialog open={resetConfirm} onClose={() => setResetConfirm(false)} onDone={() => navigate('/app')} />
      <AssistantDock />
    </div>
  )
}

function ResetConfirmDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-forest-950/55" onClick={onClose} aria-hidden />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label="Reset workspace data"
            initial={{ scale: 0.97, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 6, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-surface p-5 shadow-lift ring-1 ring-line"
          >
            <p className="text-[15px] font-bold text-ink">Reset workspace data?</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              This clears locally created history, fields, notifications, comparison saves and
              community reports, and restores the starter dataset. Your preferences are kept.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-xl px-3.5 py-2 text-[13px] font-semibold text-muted hover:bg-surface-2">
                Cancel
              </button>
              <button
                onClick={() => {
                  resetWorkspaceData()
                  onDone()
                }}
                className="rounded-xl bg-danger px-3.5 py-2 text-[13px] font-bold text-white hover:brightness-95"
              >
                Reset data
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { navTitleForPath, NAV_SECTIONS }

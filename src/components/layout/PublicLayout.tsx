import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { cn } from '../../utils'
import { Logo } from './Logo'
import { PublicFooter } from './Footer'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Features', to: '/features' },
  { label: 'Research & Trust', to: '/research' },
  { label: 'About', to: '/about' },
]

export function PublicLayout() {
  const [solid, setSolid] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 28)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Skip to content
      </a>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          solid ? 'bg-surface/85 shadow-card backdrop-blur-md ring-1 ring-inset ring-line' : 'bg-transparent',
        )}
      >
        <nav aria-label="Main" className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" aria-label="AgrowNex home" className="rounded-lg" onClick={() => setDrawerOpen(false)}>
            <Logo />
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-lg px-3.5 py-2 text-[13.5px] font-semibold transition-colors duration-150',
                    isActive ? 'text-brand' : 'text-muted hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand px-4.5 py-2.5 text-sm font-bold text-on-brand shadow-[0_10px_24px_-10px_rgb(38_122_86/0.5)] transition hover:bg-brand-strong"
            >
              Open Workspace
              <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          <button
            type="button"
            className={cn(
              'grid h-10 w-10 place-items-center rounded-xl text-ink ring-1 ring-inset ring-line',
              solid ? 'bg-surface' : 'bg-surface/70',
              'lg:hidden',
            )}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-forest-950/45" onClick={() => setDrawerOpen(false)} aria-hidden />
            <motion.div
              role="dialog"
              aria-label="Mobile menu"
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-3 top-[78px] rounded-2xl bg-surface p-3 shadow-lift ring-1 ring-line"
            >
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-xl px-4 py-3 text-[15px] font-semibold transition',
                      isActive ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-surface-2',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link
                to="/app"
                onClick={() => setDrawerOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-[15px] font-bold text-on-brand"
              >
                Open Workspace <ArrowUpRight size={16} />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" className="flex-1 pt-[68px]">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

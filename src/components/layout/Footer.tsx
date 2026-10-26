import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const PRODUCT_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Features', to: '/features' },
  { label: 'Research & Trust', to: '/research' },
  { label: 'About', to: '/about' },
]

const WORKSPACE_LINKS = [
  { label: 'Overview dashboard', to: '/app' },
  { label: 'Crop diagnosis', to: '/app/diagnosis' },
  { label: 'Explainable results', to: '/app/explanations' },
  { label: 'Treatment planner', to: '/app/treatments' },
  { label: 'Community early warning', to: '/app/community' },
  { label: 'AI assistant', to: '/app/assistant' },
]

const MORE_LINKS = [
  { label: 'Fields & crops', to: '/app/fields' },
  { label: 'Analysis history', to: '/app/history' },
  { label: 'Notifications', to: '/app/notifications' },
  { label: 'Settings', to: '/app/settings' },
  { label: 'Research evaluation', to: '/app/evaluation' },
]

export function PublicFooter() {
  return (
    <footer className="grain relative overflow-hidden bg-forest-900 text-ivory">
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo />
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-sage-300/85">
              Understand your crops. Grow with confidence. An explainable agricultural
              intelligence platform connecting crop health assessment, treatment planning
              and community early warning.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-sage-300 ring-1 ring-inset ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-dawn-deep" aria-hidden />
              Built to show its reasoning · data stays on your device
            </p>
          </div>
          <FooterCol title="Product" links={PRODUCT_LINKS} />
          <FooterCol title="Workspace" links={WORKSPACE_LINKS} />
          <FooterCol title="More" links={MORE_LINKS} />
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12.5px] text-sage-300/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AgrowNex — final-year B.Tech CSE research project.</p>
          <p className="max-w-xl leading-relaxed">
            Figures across this site are computed from the starter dataset. No real
            predictions, diagnoses or outbreak claims are made.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sage-400/70">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="text-[13.5px] text-sage-300/90 transition hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Award, Code2, Cpu, Database, Globe, GraduationCap, HeartHandshake, Layers, ShieldCheck, Sprout, Users } from 'lucide-react'
import { usePageTitle } from '../hooks'
import { SceneDawnField } from '../components/layout/scenes'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const CHALLENGES = [
  { icon: Sprout, title: 'Field knowledge is situational', body: 'Generic advisories ignore what the farmer is actually looking at — the specific leaves, the weather this week, this field\'s history.' },
  { icon: Award, title: 'Trust is not an interface trick', body: 'A scoreline of "87%" persuades nobody who has seen wrong predictions. Reasoning shown honestly beats confidence shown loudly.' },
  { icon: Globe, title: 'Costs decide practice', body: 'A technically correct option that does not fit the season\'s cash position simply will not happen. Planning must see the budget.' },
  { icon: Users, title: 'Signal hides in neighbours', body: 'Early signs of a spreading pattern often appear as talk between farmers long before lab confirmation — community data deserves careful, humble analysis.' },
]

const PRINCIPLES = [
  { icon: ShieldCheck, title: 'Honest by default', body: 'Status is stated plainly, uncertainty is acknowledged, and claims stay inside what the system can support.' },
  { icon: HeartHandshake, title: 'Decisions are the user\'s', body: 'The platform supports judgement; it does not replace it. Nothing is framed as an order.' },
  { icon: Cpu, title: 'Explain the reasoning surface', body: 'Wherever computation influences a shown result, the interface exposes what drove it — within the limits of the method.' },
  { icon: Database, title: 'Least data possible', body: 'Coarse regions over precise coordinates; a working export and reset; nothing pretends a server review exists yet.' },
]

const STACK = [
  ['Frontend framework', 'React 18 + Vite + TypeScript (strict)'],
  ['Styling & motion', 'Tailwind CSS v4 design tokens · Framer Motion (reduced-motion aware)'],
  ['Routing & forms', 'React Router · React Hook Form + Zod'],
  ['Charts', 'Recharts + custom SVG attribution visuals'],
  ['Typed services', 'Typed local services with deterministic logic'],
  ['Planned backend', 'Python FastAPI · ML model serving · SHAP explanations · MongoDB · knowledge retrieval · agent orchestration'],
]

export function AboutPage() {
  usePageTitle('About')
  return (
    <>
      <section className="relative overflow-hidden" aria-label="About hero">
        <div aria-hidden className="absolute inset-0">
          <SceneDawnField className="h-full w-full object-cover" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-canvas via-canvas/50 to-canvas" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 sm:pt-28 lg:px-8">
          <div className="max-w-2xl">
            <p className="kicker text-caution">About AgrowNex</p>
            <h1 className="text-balance mt-3 text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink">
              A research-oriented decision-support platform
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">
              AgrowNex began as a final-year B.Tech CSE question: what would it take to build an
              agricultural intelligence platform where the explanation, the budget and the
              neighbourhood are first-class citizens — not afterthoughts. The current build is the
              full frontend of that answer: a complete, working product with local-first data,
              ready to welcome its real backend.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-16 px-5 py-16 lg:px-8">
        <section aria-label="Mission">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }}>
              <p className="kicker text-brand">Mission</p>
              <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">
                Help farmers understand crops, weigh options and act with confidence — without inventing certainty
              </h2>
              <ul className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed text-muted">
                <li>• Make crop-health assessment <strong className="text-ink">interrogable</strong>: every result shows its drivers and its limits.</li>
                <li>• Make treatment comparison <strong className="text-ink">budget-aware</strong>: suitability and safety before affordability.</li>
                <li>• Make community signals <strong className="text-ink">useful and calm</strong>: trends, not theatrics.</li>
                <li>• Keep the system <strong className="text-ink">researchable</strong>: metrics defined, seams typed, claims labellable.</li>
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, delay: 0.08, ease }} className="rounded-3xl bg-forest-900 p-6 text-ivory shadow-lift">
              <GraduationCap size={22} className="text-sage-400" />
              <p className="mt-3 text-[15px] font-bold">Project context</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-sage-300/85">
                Developed as a final-year B.Tech CSE major project. The frontend phase
                establishes the product foundation and interaction design; backend, ML training,
                XAI integration, database work and agent orchestration are the next research
                phases.
              </p>
              <Link to="/research" className="group mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-sage-300">
                Read the research page <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>

        <section aria-label="Core challenges">
          <p className="kicker text-faint">The field</p>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">Challenges this project takes on</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {CHALLENGES.map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: i * 0.06, ease }} className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line">
                <c.icon size={20} className="text-brand" aria-hidden />
                <p className="mt-3 text-[15px] font-bold text-ink">{c.title}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section aria-label="Responsible AI principles">
          <p className="kicker text-faint">Quarantine for hype</p>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">Responsible AI principles</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: i * 0.06, ease }} className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line">
                <p.icon size={19} className="text-brand" aria-hidden />
                <p className="mt-3 text-[14px] font-bold text-ink">{p.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section aria-label="Intended users">
          <p className="kicker text-faint">For whom</p>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">Intended users</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ['Farmers & growers', 'Primary decision-makers assessing symptoms and planning within a real budget.'],
              ['Extension officers', 'A structured view of what farmers in a region are reporting and how trends move.'],
              ['Researchers', 'A transparent build: visible methodology, evaluation plans and typed seams for integration.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line">
                <p className="text-[15px] font-bold text-ink">{t}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Technology overview">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Layers size={20} className="text-brand" aria-hidden />
              <p className="kicker mt-2 text-faint">Under the hood</p>
              <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">Technology overview</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                A deliberate, boring-in-the-good-way stack. Stable versions, typed contracts, no
                exotic dependencies — the complexity lives in the synthesis, not the plumbing.
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line">
              {STACK.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-6">
                  <p className="w-40 shrink-0 text-[12px] font-bold uppercase tracking-wide text-faint">{k}</p>
                  <p className="text-[13.5px] leading-relaxed text-muted">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Final note">
          <div className="rounded-3xl bg-brand-soft p-8 ring-1 ring-inset ring-brand/15 sm:p-10">
            <Code2 size={22} className="text-brand" aria-hidden />
            <h2 className="mt-3 max-w-2xl text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
              A build you can defend line by line
            </h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">
              Every screen states its data status. Every service is replaceable. Every
              advertised interaction is actually wired. That is the standard this build holds itself to — because a research project earns credibility the same way a farmer earns a reputation: by being right about what it knows and humble about what it does not.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/app" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-[14px] font-bold text-on-brand transition hover:bg-brand-strong">
                Open the workspace <ArrowRight size={15} />
              </Link>
              <Link to="/features" className="inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-3 text-[14px] font-bold text-ink ring-1 ring-inset ring-line-strong transition hover:ring-brand/40">
                See all features
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

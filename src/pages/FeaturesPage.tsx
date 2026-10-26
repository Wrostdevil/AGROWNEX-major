import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Coins,
  Filter,
  FlaskConical,
  History,
  ImagePlus,
  Info,
  Lightbulb,
  Map,
  MessageSquare,
  Radar,
  ShieldCheck,
  Sprout,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { usePageTitle } from '../hooks'
import { SceneLeafMacro } from '../components/layout/scenes'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

function A({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-brand underline decoration-brand/30 decoration-2 underline-offset-2 transition hover:decoration-brand">
      {children}
    </Link>
  )
}

const GROUPS: {
  id: string
  title: string
  caption: string
  features: { title: string; body: React.ReactNode; icon: LucideIcon; to: string | null; tag?: string }[]
}[] = [
  {
    id: 'assessment',
    title: 'Crop health assessment',
    caption: 'Guided input → honest result',
    features: [
      { title: 'Three-stage diagnosis flow', body: <>Crop, symptom and environment inputs walk a validated <A to="/app/diagnosis">three-stage workflow</A> with a reviewed result screen.</>, icon: Sprout, to: '/app/diagnosis' },
      { title: 'Optional image upload', body: 'Drag-and-drop or file picker with preview, type and 5 MB size validation, local downscaling and one-click removal.', icon: ImagePlus, to: '/app/diagnosis' },
      { title: 'Symptom & environment inputs', body: 'Grouped symptom chips and optional humidity, rain, temperature, soil and stage selections — all optional where sensible.', icon: Filter, to: '/app/diagnosis' },
      { title: 'Deterministic, reproducible responses', body: 'Results are reproducible typed responses — no random numbers, and the analysis is deterministic at every step.', icon: Info, to: '/app/diagnosis', tag: 'reproducible' },
    ],
  },
  {
    id: 'intelligence',
    title: 'Explainable intelligence',
    caption: 'Why an assessment happened — in two readings',
    features: [
      { title: 'Interactive explanation view', body: <>Click feature bars to inspect each factor — farmer words on one side, technical weights on the other in the <A to="/app/explanations">XAI workspace</A>.</>, icon: Lightbulb, to: '/app/explanations' },
      { title: 'SHAP-ready method notes', body: 'The result carries model metadata and the exact explanation method description, ready to swap for real SHAP values per model family.', icon: BarChart3, to: '/research' },
      { title: 'Farmer-friendly language mode', body: 'Complex explanations rewrite into plain language; more regional languages are listed honestly as planned, not shipped.', icon: MessageSquare, to: '/app/settings' },
      { title: 'Limitations, up front', body: 'Correlation ≠ causation, symptom overlap, missing field history — the workspace states these on the results screen itself.', icon: Info, to: '/app/explanations' },
    ],
  },
  {
    id: 'planning',
    title: 'Cost-aware treatment planning',
    caption: 'Options you can afford and actually apply',
    features: [
      { title: 'Constraint-first ranking', body: <>The <A to="/app/treatments">planner</A> weighs suitability and safety before affordability — cheap-but-unsuitable never wins.</>, icon: ShieldCheck, to: '/app/treatments' },
      { title: 'Live budget comparison', body: 'Move the budget slider or type a value; ranking, flags and "what changed" notes update instantly.', icon: Coins, to: '/app/treatments' },
      { title: 'Evidence status, never invented', body: 'Options carry declared evidence statuses — grade A structure, limited, or "Evidence unavailable". No invented citations.', icon: BookOpen, to: '/app/treatments' },
      { title: 'Saved comparisons', body: 'Record up to three options side-by-side; saves appear in history and notifications where useful.', icon: History, to: '/app/treatments' },
    ],
  },
  {
    id: 'community',
    title: 'Community early warning',
    caption: 'Regional trends with careful wording',
    features: [
      { title: 'Weekly trend charts', body: <>Region + crop + symptom filters recompute the series in the <A to="/app/community">early-warning centre</A>, tooltips explain each point.</>, icon: Radar, to: '/app/community' },
      { title: 'Cautious alert levels', body: 'Steady / watch / attention computed from recent-vs-prior report windows — with absolute count floors to avoid noise.', icon: Bell, to: '/app/community' },
      { title: 'Privacy-conscious reporting', body: 'Report submission uses coarse regions and no precise coordinates — the design principle is visible today.', icon: Map, to: '/app/community' },
      { title: 'Data-quality panel', body: 'A data-provenance note sits next to every chart, so trends are always read together with their source.', icon: Info, to: '/app/community', tag: 'data provenance' },
    ],
  },
  {
    id: 'system',
    title: 'Agent architecture & workspace systems',
    caption: 'The coordination layer, made visible',
    features: [
      { title: 'Agent activity timeline', body: <>The <A to="/app/assistant">assistant</A> shows which capability handled each answer — never a fabricated tool call.</>, icon: Bot, to: '/app/assistant' },
      { title: 'Capability contracts', body: 'Orchestrator, knowledge, analysis, treatment, community and safety capabilities are typed and documented for real implementation later.', icon: Waypoints, to: '/research' },
      { title: 'Field & crop profiles', body: <>Create and edit fields, log observations, and connect them to <A to="/app/history">assessment history</A>.</>, icon: Map, to: '/app/fields' },
      { title: 'Research evaluation plan', body: <>Metric definitions and clearly-marked groundwork charts in the <A to="/app/evaluation">evaluation workspace</A> — results appear only when experiments run.</>, icon: FlaskConical, to: '/app/evaluation', tag: 'planned' },
    ],
  },
]

export function FeaturesPage() {
  usePageTitle('Features')
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-16 sm:pt-24 lg:px-8" aria-label="Features hero">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="kicker text-brand">Everything inside</p>
            <h1 className="text-balance mt-3 text-[clamp(2.2rem,5.5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink">
              Every capability in the build — and where each one ends
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
              Everything below links into the live workspace. Capabilities still under
              development are labelled as such.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['The 5 groups are live', 'All links work', 'Statuses labelled honestly'].map((t) => (
                <span key={t} className="rounded-full bg-surface px-3.5 py-1.5 text-[12px] font-bold text-muted ring-1 ring-inset ring-line">{t}</span>
              ))}
            </div>
          </div>
          <div aria-hidden className="relative hidden h-72 overflow-hidden rounded-3xl ring-1 ring-line lg:block">
            <SceneLeafMacro className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {GROUPS.map((group, gi) => (
        <section key={group.id} className="mx-auto max-w-7xl px-5 py-10 lg:px-8" aria-label={group.title}>
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, ease }}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kicker text-faint">Group {gi + 1}</p>
                <h2 className="mt-1.5 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">{group.title}</h2>
              </div>
              <p className="text-[13px] font-semibold text-muted">{group.caption}</p>
            </div>
          </motion.div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {group.features.map((f, fi) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: fi * 0.06, ease }}
                className="relative flex flex-col rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line"
              >
                {f.tag && (
                  <span className="absolute right-4 top-4 rounded-full bg-dawn px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-caution ring-1 ring-inset ring-caution/25">
                    {f.tag}
                  </span>
                )}
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <f.icon size={19} />
                </span>
                <p className="mt-3 text-[15px] font-bold text-ink">{f.title}</p>
                <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">{f.body}</p>
                {f.to && (
                  <Link to={f.to} className="group mt-3 inline-flex items-center gap-1.5 self-start text-[12.5px] font-bold text-brand">
                    Open in workspace <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-3xl bg-forest-900 px-6 py-10 text-center sm:px-12" aria-label="Feature boundaries note">
          <p className="kicker text-sage-400">Said plainly</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-[24px] font-extrabold tracking-tight text-ivory sm:text-[28px]">
            No unimplemented capability is advertised as a working real-world service
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-sage-300/85">
            Image-based disease identification, real SHAP values, verified treatment sources and live
            community monitoring are future-phase integrations. Their screens already exist —
            clearly labelled “planned” until those integrations land.
          </p>
        </div>
      </section>
    </>
  )
}

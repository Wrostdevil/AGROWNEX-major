import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { SectionHeading } from '../../components/ui/shared'
import { SceneLeafMacro } from '../../components/layout/scenes'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface Showcase {
  id: string
  kicker: string
  title: string
  body: string
  to: string
  linkLabel: string
  preview: React.ReactNode
  flip?: boolean
}

export function FeatureShowcase() {
  const items: Showcase[] = [
    {
      id: 'diagnose',
      kicker: '01 · Assess',
      title: 'Guided crop assessment',
      body: 'A three-stage flow — describe the crop, review the analysis, read an honest result with matched symptoms and an uncertainty note. Image upload is optional, downsized locally, and never required.',
      to: '/app/diagnosis',
      linkLabel: 'Try the diagnosis flow',
      preview: (
        <div className="space-y-2.5">
          {['Tomato · fruiting stage', 'Dark spots · yellowing · humid spell', 'Assessing 3 matching patterns'].map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: 14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15 + i * 0.15, ease }}
              className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2 text-[12px] font-semibold text-ink ring-1 ring-inset ring-line"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t}
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: 'explain',
      kicker: '02 · Understand',
      title: 'Explanations, in two voices',
      body: 'Farmer-friendly mode says what matters in plain words; technical mode shows contribution weights, model metadata and limitations. Switch view — the insight stays consistent.',
      to: '/app/explanations',
      linkLabel: 'See an explained result',
      flip: true,
      preview: (
        <div className="space-y-3">
          {[
            { label: 'Dark lesions', w: 0.42 },
            { label: 'Yellowing', w: 0.2 },
            { label: 'Warm humid spell', w: 0.18 },
            { label: 'Baseline pull-back', w: -0.2 },
          ].map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0, x: f.w < 0 ? -14 : 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease }} className="flex items-center gap-2">
              <span className="w-24 text-right text-[11px] font-semibold text-muted">{f.label}</span>
              <span className="relative h-2.5 flex-1">
                <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                <motion.span
                  className={cn('absolute inset-y-0 rounded-full', f.w > 0 ? 'left-1/2 bg-danger' : 'right-1/2 bg-brand')}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.abs(f.w) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease }}
                />
              </span>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: 'plan',
      kicker: '03 · Decide',
      title: 'Budget within reach, safety first',
      body: 'Move the budget slider and the ranking reorders live. Suitability and safety are weighted before affordability — a cheap-but-unsuitable option never floats to the top. Anything above budget is flagged clearly, not hidden.',
      to: '/app/treatments',
      linkLabel: 'Open the treatment planner',
      preview: (
        <div className="space-y-2">
          {['₹0–120 · removal + sanitation', '₹380–520 · protectant spray', '₹0 · adjust irrigation timing'].map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.12 + i * 0.14, ease }}
              className="rounded-lg bg-forest-900 px-3 py-2.5 text-[12px] font-semibold text-sage-300"
            >
              {t}
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: 'community',
      kicker: '04 · Stay aware',
      title: 'Community trends, cautiously worded',
      body: 'Weekly report-volume charts per region, live recomputed alerts and an optional report submission — with trend language that stops short of outbreak claims.',
      to: '/app/community',
      linkLabel: 'Explore the early-warning centre',
      flip: true,
      preview: (
        <motion.svg viewBox="0 0 260 90" className="w-full" initial="hidden" whileInView="show">
          <motion.path
            d="M6 74 L36 70 L66 66 L96 60 L126 55 L156 48 L186 40 L216 30 L246 18"
            fill="none"
            stroke="#267A56"
            strokeWidth="3"
            strokeLinecap="round"
            variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1.1, ease } } }}
          />
          <circle cx="246" cy="18" r="5" fill="#C58B36" />
          <text x="196" y="10" fontSize="10" fill="#C58B36" fontWeight="700">uptick</text>
        </motion.svg>
      ),
    },
  ]

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8" aria-label="Feature showcase">
      <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }}>
        <SectionHeading
          kicker="In the workspace"
          title="What using AgrowNex feels like"
          description="Each card links straight into the live workspace."
        />
      </motion.div>

      <div className="mt-14 space-y-16 lg:space-y-24">
        {items.map((item) => (
          <ShowcaseRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function ShowcaseRow({ item }: { item: Showcase }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease }}
      className={cn('grid items-center gap-10 lg:grid-cols-2 lg:gap-16', item.flip && 'lg:[&>*:first-child]:order-2')}
    >
      <div>
        <p className="kicker text-caution">{item.kicker}</p>
        <h3 className="mt-2 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">{item.title}</h3>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">{item.body}</p>
        <Link
          to={item.to}
          className="group mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-brand"
        >
          {item.linkLabel}
          <ArrowUpRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-soft via-surface-2 to-surface p-6 ring-1 ring-inset ring-line sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-sage-400/20 blur-3xl" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-danger/70" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-caution/70" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-brand/70" aria-hidden />
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-faint">workspace preview</span>
          </div>
          {item.preview}
        </div>
      </div>
    </motion.div>
  )
}

/** Editorial leaf vignette used between showcases. */
export function LeafDivider() {
  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-5 py-6 lg:px-8">
      <div className="relative h-36 overflow-hidden rounded-2xl">
        <SceneLeafMacro className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-transparent to-transparent" aria-hidden />
      </div>
    </div>
  )
}

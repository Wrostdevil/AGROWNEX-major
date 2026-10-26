import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Bell, CheckCircle2, ChevronRight, Wallet } from 'lucide-react'
import { usePreferences } from '../../services/preferences'
import { SceneDawnField } from '../../components/layout/scenes'
import { ConfidenceRing } from '../../components/charts/FeatureImportanceChart'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const systemReduced = useReducedMotion()
  const prefs = usePreferences()
  const reduced = systemReduced || prefs.reducedMotion

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yFar = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 90])
  const yMid = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 46])
  const yCards = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -30])
  const sceneFade = useTransform(scrollYProgress, [0, 0.9], [1, 0.45])

  return (
    <section ref={ref} className="relative overflow-hidden pb-16 sm:pb-24">
      {/* Backdrop scene */}
      <motion.div style={{ y: yFar, opacity: sceneFade }} className="pointer-events-none absolute inset-0" aria-hidden>
        <SceneDawnField className="h-full w-full object-cover" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-canvas via-transparent to-canvas" aria-hidden />

      {/* drifting pollen */}
      {!reduced && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {[
            { left: '12%', top: '38%', delay: 0, dur: 13 },
            { left: '30%', top: '24%', delay: 2.4, dur: 11 },
            { left: '68%', top: '30%', delay: 5, dur: 15 },
            { left: '82%', top: '20%', delay: 1.2, dur: 12 },
            { left: '52%', top: '14%', delay: 3.6, dur: 10 },
            { left: '92%', top: '44%', delay: 4.4, dur: 14 },
          ].map((p, i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-dawn-deep/70"
              style={{ left: p.left, top: p.top }}
              animate={{ y: [-10, -46], x: [-8, 10], opacity: [0, 0.85, 0] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-10 pt-16 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-20">
        {/* Copy */}
        <motion.div style={{ y: yCards }} initial="hidden" animate="show">
          <motion.p variants={fadeUp(reduced)} transition={{ duration: 0.5, ease }} className="kicker text-caution">
            Explainable agricultural intelligence
          </motion.p>
          <motion.h1
            variants={fadeUp(reduced, 0.08)}
            transition={{ duration: 0.6, ease }}
            className="text-balance mt-4 font-extrabold leading-[0.98] tracking-[-0.03em] text-ink text-[clamp(2.6rem,6.2vw,4.6rem)]"
          >
            Understand your crops.
            <span className="block">
              Grow with <span className="relative whitespace-nowrap text-brand">confidence<svg aria-hidden viewBox="0 0 220 12" className="absolute -bottom-1.5 left-0 w-full h-[10px] text-brand/35" preserveAspectRatio="none"><path d="M3 9 C 60 3, 150 2, 217 7" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/></svg></span>
            </span>
          </motion.h1>
          <motion.p variants={fadeUp(reduced, 0.16)} transition={{ duration: 0.6, ease }} className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-muted">
            An explainable agricultural intelligence platform connecting crop health
            assessment, evidence-informed treatment planning and community-level early
            warning — built to show its reasoning, not just scores.
          </motion.p>
          <motion.div variants={fadeUp(reduced, 0.24)} transition={{ duration: 0.6, ease }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-brand px-6 py-3.5 text-[15px] font-bold text-on-brand shadow-[0_16px_36px_-12px_rgb(38_122_86/0.55)] transition hover:bg-brand-strong"
            >
              Explore AgrowNex
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-2xl bg-surface/80 px-6 py-3.5 text-[15px] font-bold text-ink ring-1 ring-inset ring-line-strong backdrop-blur transition hover:ring-brand/40"
            >
              Discover how it works <ChevronRight size={16} />
            </Link>
          </motion.div>
          <motion.ul variants={fadeUp(reduced, 0.32)} transition={{ duration: 0.6, ease }} className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] font-semibold text-muted">
            {['Explainable results', 'Budget-aware planning', 'Community situational awareness', 'Research'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-brand" /> {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Floating product preview */}
        <motion.div style={{ y: yMid }} className="relative hidden min-h-[520px] lg:block" aria-hidden>
          {/* Main result card */}
          <motion.div
            initial={{ opacity: 0, y: 26, rotate: -1.2 }}
            animate={{ opacity: 1, y: 0, rotate: -1.2 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
            className="absolute right-2 top-2 w-[340px] rounded-2xl bg-surface/95 p-4 shadow-lift ring-1 ring-inset ring-line backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">Live analysis preview</p>
              <span className="rounded-full bg-caution-soft px-2 py-0.5 text-[9.5px] font-bold text-caution ring-1 ring-inset ring-caution/25">Starter data</span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <ConfidenceRing value={0.74} size={78} label="confidence band" />
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-bold text-ink">Early blight pattern</p>
                <p className="mt-0.5 text-[12px] text-muted">Dark spots + yellowing on tomato</p>
                <p className="mt-1.5 text-[11px] font-semibold text-caution">Moderate band · needs a closer look</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {[
                { label: 'Dark lesions', w: 0.42, tone: 'danger' },
                { label: 'Yellowing', w: 0.2, tone: 'danger' },
                { label: 'Warm + humid', w: 0.18, tone: 'danger' },
              ].map((f, i) => (
                <div key={f.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-[88px] shrink-0 truncate text-muted">{f.label}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <motion.span
                      className={f.tone === 'danger' ? 'block h-full rounded-full bg-danger' : 'block h-full rounded-full bg-brand'}
                      initial={{ width: 0 }}
                      animate={{ width: `${f.w * 140}%` }}
                      transition={{ duration: 0.8, delay: 0.9 + i * 0.12, ease }}
                    />
                  </span>
                  <span className="tabular w-7 text-right font-bold text-muted">+{f.w.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Treatment compare card */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 1.4 }}
            animate={{ opacity: 1, y: 0, rotate: 1.4 }}
            transition={{ duration: 0.7, delay: 0.55, ease }}
            className="animate-float-slow absolute bottom-16 left-0 w-[300px] rounded-2xl bg-forest-900/95 p-4 text-ivory shadow-lift ring-1 ring-inset ring-white/10 backdrop-blur"
          >
            <div className="flex items-center gap-2 text-sage-300">
              <Wallet size={14} />
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em]">Treatment · ₹600 budget</p>
            </div>
            {[
              { name: 'Remove affected leaves', cost: '₹0–120', fit: 'best fit' },
              { name: 'Protectant copper spray', cost: '₹380–520', fit: 'option A' },
              { name: 'Neem-oil spray', cost: '₹280–420', fit: 'limited' },
            ].map((t) => (
              <div key={t.name} className="mt-2.5 flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-[11.5px]">
                <span className="min-w-0 truncate font-semibold text-ivory/95">{t.name}</span>
                <span className="tabular shrink-0 font-bold text-dawn-deep">{t.cost}</span>
              </div>
            ))}
          </motion.div>

          {/* Community alert chip */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75, ease }}
            className="animate-float absolute right-10 bottom-6 flex items-center gap-3 rounded-xl bg-surface/95 px-3.5 py-2.5 shadow-lift ring-1 ring-inset ring-line backdrop-blur"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-caution-soft text-caution"><Bell size={15} /></span>
            <div>
              <p className="text-[12px] font-bold text-ink">Watch alert — North District</p>
              <p className="text-[10.5px] text-muted">Dark-spot reports trending up · watch level</p>
            </div>
          </motion.div>

          {/* connective dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="absolute left-1/2 top-1/2 h-16 w-px bg-gradient-to-b from-brand/50 to-transparent"
          />
        </motion.div>
      </div>

      {/* Rotating capability ticker */}
      <Ticker />
    </section>
  )
}

function Ticker() {
  const lines = [
    'Predictions arrive with explanations — not as verdicts',
    'Treatment ranking weighs suitability and safety before cheapness',
    'A rise in report volume is “possible activity”, never a stated outbreak',
    'Built to show its reasoning — every result travels with its explanation',
  ]
  return (
    <div className="border-y border-line bg-surface/60 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1.5 px-5 text-center">
        {lines.map((l) => (
          <span key={l} className="flex items-center gap-2 text-[12.5px] font-semibold text-muted">
            <span className="h-1 w-1 rounded-full bg-brand" aria-hidden />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

function fadeUp(reduced: boolean, delay = 0) {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 18 },
    show: { opacity: 1, y: 0 },
  } as const
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { SectionHeading } from '../../components/ui/shared'
import { formatCompactINR } from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface SampleOption {
  id: string
  name: string
  costMid: number
  band: string
  suitability: number
  evidence: 'sample-grade' | 'sample-limited' | 'unavailable'
  note: string
}

const OPTIONS: SampleOption[] = [
  { id: 'remove', name: 'Remove & destroy affected leaves', costMid: 60, band: '₹0–120', suitability: 0.9, evidence: 'sample-limited', note: 'Cultural practice · best at early spread' },
  { id: 'copper', name: 'Protectant copper spray', costMid: 450, band: '₹380–520', suitability: 0.85, evidence: 'sample-grade', note: 'Useful applied before further spread' },
  { id: 'neem', name: 'Neem-oil spray', costMid: 350, band: '₹280–420', suitability: 0.7, evidence: 'sample-limited', note: 'Gentle option for early, light patches' },
  { id: 'triazole', name: 'Systemic triazole spray', costMid: 560, band: '₹480–640', suitability: 0.72, evidence: 'sample-grade', note: 'Curative-leaning; observe label intervals' },
]

export function TreatmentShowcase() {
  const [budget, setBudget] = useState(500)

  const ranked = useMemo(() => {
    return [...OPTIONS]
      .map((o) => {
        const within = o.costMid <= budget
        const budgetFit = within ? 1 : Math.max(0, 1 - (o.costMid - budget) / Math.max(o.costMid, 1) / 0.5)
        const score = 0.55 * o.suitability + 0.2 * budgetFit
        return { ...o, within, score }
      })
      .sort((a, b) => b.score - a.score)
  }, [budget])

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8" aria-label="Treatment planner preview">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }}>
          <SectionHeading
            kicker="Cost-aware planning · interactive"
            title="Move the budget. Watch the plan re-order."
            description="A miniature of the treatment planner: suitability and safety weigh before affordability, above-budget options stay visible with a clear flag, and missing evidence is never hidden."
          />
          <div className="mt-6 rounded-2xl bg-brand-soft p-4 text-[13px] leading-relaxed text-ink ring-1 ring-inset ring-brand/15">
            <ShieldCheck size={16} className="mb-1.5 text-brand" aria-hidden />
            Indicative figures. No dosage, real efficacy or price is claimed — verified
            formulations and printed labels arrive when the backed services connect.
          </div>
          <Link to="/app/treatments" className="group mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-brand">
            Open the full planner <ArrowUpRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.08, ease }}
          className="rounded-3xl bg-surface p-6 shadow-card ring-1 ring-inset ring-line"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-bold text-ink">Per-acre budget</p>
            <p className="tabular rounded-xl bg-brand-soft px-3 py-1.5 text-[14px] font-extrabold text-brand ring-1 ring-inset ring-brand/20">{formatCompactINR(budget)}</p>
          </div>
          <input
            type="range"
            min={100}
            max={800}
            step={20}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            aria-label="Set per-acre budget"
            className="mt-3 w-full"
          />
          <div className="mt-1 flex justify-between text-[11px] font-semibold text-faint">
            <span>₹100</span><span>₹800</span>
          </div>

          <p className="mb-2 mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
            Live ranking preview
          </p>
          <div className="space-y-2.5">
            {ranked.map((o, i) => (
              <motion.div
                key={o.id}
                layout
                transition={{ duration: 0.3, ease }}
                className={cn(
                  'rounded-xl px-4 py-3 ring-1 ring-inset transition-colors',
                  i === 0 ? 'bg-brand-soft ring-brand/25' : 'bg-surface-2/70 ring-line',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2 text-[13.5px] font-bold text-ink">
                    <span className={cn('tabular grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-extrabold', i === 0 ? 'bg-brand text-on-brand' : 'bg-surface text-faint ring-1 ring-inset ring-line')}>{i + 1}</span>
                    <span className="truncate">{o.name}</span>
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular text-[12.5px] font-bold text-ink">{o.band}</span>
                    {!o.within && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[9.5px] font-bold text-danger">above budget</span>}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
                      <motion.span className="block h-full rounded-full bg-brand" initial={false} animate={{ width: `${o.suitability * 100}%` }} />
                    </span>
                    suitability
                  </span>
                  <span>evidence: {o.evidence === 'sample-grade' ? 'grade A' : o.evidence === 'sample-limited' ? 'limited' : 'unavailable'}</span>
                </div>
                <p className="mt-1.5 text-[11.5px] text-faint">{o.note}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

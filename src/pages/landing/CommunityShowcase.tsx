import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, BellRing } from 'lucide-react'
import { SectionHeading } from '../../components/ui/shared'
import { TrendAreaChart } from '../../components/charts/TrendAreaChart'
import { REGIONS } from '../../data/catalog'
import { getSeries, computeAlert } from '../../data/community'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function CommunityShowcase() {
  const [regionId, setRegionId] = useState('north')
  const series = useMemo(() => getSeries(regionId, 'tomato', 'leaf-brown-spots'), [regionId])
  const alert = useMemo(() => computeAlert(regionId, 'tomato', 'leaf-brown-spots'), [regionId])
  const total = series[series.length - 1]?.count ?? 0
  const first = series[0]?.count ?? 0

  return (
    <section className="border-y border-line bg-surface-2/50 py-16 sm:py-24" aria-label="Community early-warning preview">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }}>
            <SectionHeading
              kicker="Community early warning"
              title="Trends, not tinder for panic"
              description="Community reports are aggregated weekly per region. When recent counts rise well above the prior window, a low-key “attention” flag appears — worded carefully, always with its uncertainty note."
            />
            <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-muted">
              <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />Comparisons count recent weeks against the longer prior window.</li>
              <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />Flag wording stays at "possible increased activity" — never "confirmed outbreak".</li>
              <li className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />Fixed starter regions keep week-to-week comparisons consistent.</li>
            </ul>
            <Link to="/app/community" className="group mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-brand">
              Explore the early-warning centre <ArrowUpRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className="rounded-3xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Dark-spot reports · tomato · 12 weeks</p>
                <p className="mt-0.5 text-[15px] font-bold text-ink">{REGIONS.find((r) => r.id === regionId)!.name}</p>
              </div>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                aria-label="Choose a region"
                className="rounded-xl bg-surface-2 px-3 py-2 text-[12.5px] font-semibold text-ink ring-1 ring-inset ring-line"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <TrendAreaChart data={series.map((p) => ({ label: p.label, count: p.count }))} height={220} ariaLabel={`Weekly report counts for ${regionId}, dark spots on tomato`} />
              <p className="mt-1 text-center text-[11px] text-faint" aria-hidden>
                This week: {total} vs {first} twelve weeks ago — {alert.level === 'attention' ? 'recent window well above the earlier one' : alert.level === 'watch' ? 'gradual rise' : 'broadly steady'}
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-caution-soft/70 px-4 py-3.5 ring-1 ring-inset ring-caution/20">
              <BellRing size={16} className="mt-0.5 shrink-0 text-caution" aria-hidden />
              <div>
                <p className="text-[12.5px] font-bold text-caution dark:text-caution">{alert.level === 'attention' ? 'Attention-level' : alert.level === 'watch' ? 'Watch-level' : 'Steady-state'} flag · North District tomato</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted dark:text-muted">{alert.trendSummary}</p>
                <p className="mt-1 text-[11px] italic text-faint">{alert.uncertaintyNote}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

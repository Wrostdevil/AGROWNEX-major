import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Lightbulb, Radar, Sprout, Wallet } from 'lucide-react'
import { SectionHeading } from '../../components/ui/shared'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const PILLARS = [
  {
    icon: Sprout,
    title: 'Crop Intelligence',
    body: 'Symptom and environment inputs assessed against pattern profiles, with optional image capture in the guided flow.',
    to: '/app/diagnosis',
  },
  {
    icon: Lightbulb,
    title: 'Explainable AI',
    body: 'Every assessment arrives with its factors — read in farmer language or technical contribution view.',
    to: '/app/explanations',
  },
  {
    icon: Wallet,
    title: 'Cost-Aware Treatment',
    body: 'Options ranked with cost bands, suitability and safety notes against a budget you set.',
    to: '/app/treatments',
  },
  {
    icon: Radar,
    title: 'Community Early Warning',
    body: 'Community reports aggregated across regions to surface potential activity trends — with honest uncertainty.',
    to: '/app/community',
  },
]

export function Capabilities() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8" aria-label="Core capabilities">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, ease }}
      >
        <SectionHeading
          kicker="The four pillars"
          title="Four capabilities, one decision flow"
          description="AgrowNex is designed around the way a decision actually happens: notice something, understand it, weigh your options, and stay aware of what neighbours are seeing."
        />
      </motion.div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease }}
          >
            <Link
              to={p.to}
              className="group flex h-full flex-col rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-on-brand">
                <p.icon size={20} />
              </span>
              <p className="mt-4 text-[15.5px] font-bold text-ink">{p.title}</p>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{p.body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand">
                Open in workspace <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

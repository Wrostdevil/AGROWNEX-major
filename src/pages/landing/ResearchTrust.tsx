import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, BookOpen, Scale, ShieldCheck, Users } from 'lucide-react'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const PRINCIPLES = [
  { icon: ShieldCheck, title: 'Model transparency', body: 'The system is designed to explain what influenced each assessment — with method notes and stated limitations, not a black box.' },
  { icon: BookOpen, title: 'Evidence-informed options', body: 'Treatment information is structured to attach to verified advisories and labels. Until then, evidence placeholders stay honest, and nothing is invented.' },
  { icon: Scale, title: 'Budget-aware decisions', body: 'Ranking is constraint-first: suitability and safety before affordability, with above-budget options flagged rather than buried.' },
  { icon: Users, title: 'Responsible community reporting', body: 'Reported trends are described as report-activity patterns — the platform deliberately avoids outbreak language until verification exists.' },
  { icon: BadgeCheck, title: 'Scientific evaluation', body: 'A planned evaluation workspace defines metrics — model, explanation, ranking, agent and warning quality — before results exist. Nothing is claimed pre-experiments.' },
]

export function ResearchTrust() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8" aria-label="Research and trust">
      <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }} className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="kicker text-brand">Research & trust</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-ink sm:text-[36px]">Built like research, not like a product ad</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            AgrowNex is a final-year B.Tech research project. Its credibility comes from stating
            what is measured and what is planned — every screen carries that honesty in its bones.
          </p>
        </div>
        <Link to="/research" className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-forest-900 px-5 py-3 text-[14px] font-bold text-ivory transition hover:bg-forest-800">
          Read the research page <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PRINCIPLES.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.07, ease }}
            className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line"
          >
            <p.icon size={20} className="text-brand" aria-hidden />
            <p className="mt-3 text-[14px] font-bold text-ink">{p.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden" aria-label="Closing call to action">
      <div className="grain relative bg-forest-950 py-24 text-center sm:py-32">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="relative z-10 mx-auto max-w-3xl px-5"
        >
          <p className="kicker text-sage-400">Begin in the workspace</p>
          <h2 className="text-balance mt-3 text-[clamp(1.9rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ivory">
            Better information. More confident farming decisions.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-sage-300/85">
            The full workspace is a click away — diagnosis, explanations, treatment planning and
            community intelligence, running from the starter dataset.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/app" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-7 py-4 text-[15px] font-bold text-on-brand shadow-[0_18px_40px_-12px_rgb(38_122_86/0.6)] transition hover:bg-brand-strong">
              Open Workspace <ArrowRight size={17} />
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-7 py-4 text-[15px] font-bold text-ivory ring-1 ring-inset ring-white/15 transition hover:bg-white/10">
              See the full journey
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

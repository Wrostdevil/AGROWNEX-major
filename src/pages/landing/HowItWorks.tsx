import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { SectionHeading } from '../../components/ui/shared'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface Stage {
  id: string
  label: string
  title: string
  body: string
  appLink: { label: string; to: string } | null
  detail: string[]
  capabilities: string[]
}

const STAGES: Stage[] = [
  {
    id: 'submit',
    label: 'Stage 1',
    title: 'Submit crop information',
    body: 'A guided form collects what a good assessment needs: crop, observed symptoms, optional environment context — and optionally a photo, downsized in the browser.',
    appLink: { label: 'Open diagnosis', to: '/app/diagnosis' },
    detail: [
      'Required: crop and at least one observation — everything else is optional by design.',
      'Image upload is validated (type, size) and previewed before anything is stored.',
      'A patient note field keeps context visible to future assessments.',
    ],
    capabilities: ['Knowledge & context gathering'],
  },
  {
    id: 'analyze',
    label: 'Stage 2',
    title: 'Assess potential health risks',
    body: 'The local analysis engine compares the combination against pattern profiles in a short step-by-step animation — every run is deterministic and reproducible.',
    appLink: { label: 'Run the analysis', to: '/app/diagnosis' },
    detail: [
      'Deterministic scoring keeps results reproducible for teaching and evaluation.',
      'Stage timing is honest: analysis shows what it actually does.',
      'Future hook: this is where the FastAPI ML service will be called.',
    ],
    capabilities: ['Crop analysis (ML → future FastAPI call)'],
  },
  {
    id: 'understand',
    label: 'Stage 3',
    title: 'Read the explanation, compare treatments',
    body: 'The result opens with its factors — first in plain language, then technical contribution weights — and a treatment shortlist ranked with your budget and safety constraints applied.',
    appLink: { label: 'See explanations & planner', to: '/app/explanations' },
    detail: [
      'Farmer-friendly and technical views stay consistent with each other.',
      'Treatment entries show cost bands, suitability and evidence status.',
      'Constraint-first ranking: suitability and safety precede cheapness.',
    ],
    capabilities: ['Explanation capability (XAI)', 'Cost-aware treatment capability'],
  },
  {
    id: 'monitor',
    label: 'Stage 4',
    title: 'Watch community trends',
    body: 'Community reports aggregate weekly per region; sustained rises raise a cautious watch flag — with uncertainty language, never outbreak claims.',
    appLink: { label: 'Open early-warning centre', to: '/app/community' },
    detail: [
      'Trend language: "possible increased activity", not "confirmed outbreak".',
      'Reported windows compare 4 recent weeks against the prior 8.',
      'Analysis history and notifications keep the loop visible.',
    ],
    capabilities: ['Community early-warning capability', 'Safety review'],
  },
  {
    id: 'coordinate',
    label: 'Stage 5',
    title: 'AI-agent coordination (designed)',
    body: 'A planned orchestrator coordinates the four capabilities — the current build already shows its activity trace, so the architecture is explainable today.',
    appLink: { label: 'See the agent workflow', to: '/app/assistant' },
    detail: [
      'The assistant shows which capability handled each answer.',
      'No fabricated tool calls occur; every visible step mirrors real behaviour.',
      'This is the seam where the real orchestrator will plug in.',
    ],
    capabilities: ['Main orchestrator (designed)'],
  },
]

export function JourneyTimeline({ heading = true }: { heading?: boolean }) {
  const [openId, setOpenId] = useState<string | null>('submit')

  return (
    <section className="mx-auto max-w-6xl px-5 lg:px-8" aria-label="How the workflow unfolds">
      {heading && (
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }}>
          <SectionHeading
            kicker="The journey"
            title="From observation to understood decision"
            description="Five stages, each doing one job well. Click a stage to unfold its fine print — or jump straight into the matching workspace page."
          />
        </motion.div>
      )}

      <div className="relative mt-10">
        {/* vertical rail */}
        <div aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-line sm:left-1/2" />
        <div className="space-y-6">
          {STAGES.map((stage, i) => {
            const open = openId === stage.id
            const onRight = i % 2 === 1
            return (
              <div key={stage.id} className={`relative grid sm:grid-cols-2 sm:gap-10 ${onRight ? 'sm:text-left' : ''}`}>
                {/* node */}
                <span
                  aria-hidden
                  className={`absolute left-4 top-5 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-brand text-on-brand shadow-[0_0_0_5px_rgb(38_122_86/0.15)] sm:left-1/2 ${onRight ? '' : ''}`}
                >
                  <span className="text-[13px] font-extrabold">{i + 1}</span>
                </span>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: 0.05, ease }}
                  className={`pl-12 sm:pl-0 ${onRight ? 'sm:col-start-2 sm:pl-12' : 'sm:col-start-1 sm:pr-12 sm:text-right'}`}
                >
                  <div
                    className={`rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ${open ? 'ring-brand/30' : 'ring-line'} transition-shadow duration-200`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : stage.id)}
                      aria-expanded={open}
                      className={`flex w-full items-center justify-between gap-3 text-left ${onRight ? '' : 'sm:flex-row-reverse'}`}
                    >
                      <span>
                        <span className="kicker text-caution">{stage.label}</span>
                        <span className="mt-1 block text-[17px] font-extrabold text-ink">{stage.title}</span>
                      </span>
                      <ChevronRight size={17} className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`} aria-hidden />
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease }}
                          className={`overflow-hidden ${onRight ? '' : 'sm:text-right'}`}
                        >
                          <p className={`mt-3 text-[14px] leading-relaxed text-muted ${onRight ? 'sm:text-left' : 'sm:text-right'}`}>{stage.body}</p>
                          <ul className="mt-3 space-y-1.5">
                            {stage.detail.map((d) => (
                              <li key={d} className={`flex gap-2 text-[12.5px] text-muted ${onRight ? '' : 'sm:flex-row-reverse sm:text-right'}`}>
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                                {d}
                              </li>
                            ))}
                          </ul>
                          <div className={`mt-4 flex flex-wrap gap-2 ${onRight ? '' : 'sm:justify-end'}`}>
                            {stage.capabilities.map((c) => (
                              <span key={c} className="rounded-full bg-brand-soft px-2.5 py-1 text-[10.5px] font-bold text-brand ring-1 ring-inset ring-brand/15">
                                {c}
                              </span>
                            ))}
                          </div>
                          {stage.appLink && (
                            <Link
                              to={stage.appLink.to}
                              className={`group mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand ${onRight ? '' : 'sm:justify-self-end'}`}
                            >
                              {stage.appLink.label}
                              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HowItWorksPreview() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24" aria-label="How it works preview">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }} className="mx-auto max-w-2xl text-center">
          <p className="kicker text-brand">How it works</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-ink sm:text-[34px]">Notice. Understand. Decide. Stay aware.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            One connected flow from the field to the decision — with the workspace guiding you
            through each step.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: '1', t: 'Submit crop information', d: 'Symptoms, context, optional photo' },
            { n: '2', t: 'Assess potential risks', d: 'Deterministic analysis, step by step' },
            { n: '3', t: 'Understand & compare', d: 'Explanation + budgeted options' },
            { n: '4', t: 'Monitor community trends', d: 'Cautious early-warning flags' },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.09, ease }}
              className="relative rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-[15px] font-extrabold text-brand">{s.n}</span>
              <p className="mt-3 text-[15px] font-bold text-ink">{s.t}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{s.d}</p>
              {i < 3 && <span aria-hidden className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 lg:block" />}
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link to="/how-it-works" className="group inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-3 text-[14px] font-bold text-ink ring-1 ring-inset ring-line-strong transition hover:ring-brand/40">
            Walk through the full journey <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </p>
      </div>
    </section>
  )
}

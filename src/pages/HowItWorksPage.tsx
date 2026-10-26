import { JourneyTimeline } from './landing/HowItWorks'
import { usePageTitle } from '../hooks'
import { SceneDawnField, SceneTerraces } from '../components/layout/scenes'
import { Link } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'

export function HowItWorksPage() {
  usePageTitle('How It Works')
  return (
    <>
      <section className="relative overflow-hidden" aria-label="How it works hero">
        <div className="absolute inset-0" aria-hidden>
          <SceneDawnField className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-canvas via-canvas/40 to-canvas" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-16 sm:pt-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="kicker text-caution">The complete journey</p>
            <h1 className="text-balance mt-3 text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink">
              Every stage of the workflow, without the fog
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">
              From the first symptom you notice to a decision you can defend at the agri-input shop
              counter — here is precisely what AgrowNex does at each step, and what it
              deliberately does not do yet.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-6 lg:px-8" aria-label="Honest capabilities note">
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Info size={18} /></span>
          <p className="text-[13.5px] leading-relaxed text-muted">
            <span className="font-bold text-ink">How we start:</span> stages marked “designed” are
            specified but not yet wired. The current build runs locally on deterministic logic —
            ML inference, agent calls and backend services arrive in later phases.
          </p>
        </div>
      </section>

      <div className="py-16 sm:py-20">
        <JourneyTimeline heading={false} />
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl">
          <SceneTerraces className="absolute inset-0 h-full w-full object-cover" aria-hidden />
          <div className="relative z-10 grid gap-6 bg-forest-950/55 p-8 backdrop-blur-[2px] sm:grid-cols-3 lg:p-12">
            <TipCard title="For the farmer" body="Forms stay plain-language, defaults are smart, and the result begins with what to look at next — not jargon." />
            <TipCard title="For the evaluator" body="Every stage states what actually happened — activity logs only record steps that truly occur." />
            <TipCard title="For the builder" body="Service interfaces (analysis, treatments, community, assistant) are typed seams ready for FastAPI + ML wiring later." />
          </div>
        </div>
        <p className="mt-10 text-center">
          <Link to="/app" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-[15px] font-bold text-on-brand transition hover:bg-brand-strong">
            Open the workspace <ArrowRight size={16} />
          </Link>
        </p>
      </div>
    </>
  )
}

function TipCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] p-5 text-ivory ring-1 ring-inset ring-white/10">
      <p className="text-[15px] font-bold">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-sage-300/85">{body}</p>
    </div>
  )
}

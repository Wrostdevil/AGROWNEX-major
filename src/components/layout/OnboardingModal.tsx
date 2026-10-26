import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Radar, Sprout, Stethoscope, Wallet } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button, LinkButton } from '../ui/Button'
import { updatePreferences } from '../../services/preferences'

const SLIDES = [
  {
    icon: Stethoscope,
    title: 'Start with what you observe',
    body: 'Describe your crop, the symptoms you notice and any weather context. AgrowNex assesses the combination against pattern profiles and returns a result with matched observations and a confidence band.',
  },
  {
    icon: Lightbulb,
    title: 'Understand before you act',
    body: 'Every result travels with its explanation: which observations pushed the assessment and which pulled against it, in farmer language or technical contribution view.',
  },
  {
    icon: Wallet,
    title: 'Plan within your budget',
    body: 'Compare treatment options with cost bands, suitability and safety notes. Ranking weighs suitability and safety before affordability, and flags anything above your budget.',
  },
  {
    icon: Radar,
    title: 'Watch trends, not rumours',
    body: 'The community centre tracks report volumes across regions. Rising counts raise a calm "attention" flag with measured language — never a confirmed outbreak claim.',
  },
]

const TOTAL_STEPS = SLIDES.length + 1 // step 0 = name, steps 1..4 = tour slides

export function OnboardingModal({ open }: { open: boolean }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')

  const nameStep = step === 0
  const slide = SLIDES[step - 1]
  const isLast = step === SLIDES.length

  const finish = () => {
    updatePreferences({
      profileName: name.trim(),
      onboardedAt: Date.now(),
    })
    setStep(0)
  }

  return (
    <Dialog
      open={open}
      onClose={() => finish()}
      title={nameStep ? 'Welcome to AgrowNex' : `Setting up your workspace (${step}/${TOTAL_STEPS - 1})`}
      description={nameStep ? 'Let’s set up your workspace — it takes about a minute.' : undefined}
      size="sm"
      footer={
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === step ? 'w-5 bg-brand' : 'w-1.5 bg-surface-3'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {nameStep ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => finish()}>
                  Skip
                </Button>
                <Button size="sm" onClick={() => setStep(1)}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
                {isLast ? (
                  <LinkButton to="/app/diagnosis" size="sm" onClick={() => finish()}>
                    Start exploring
                  </LinkButton>
                ) : (
                  <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                    Next
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      {nameStep ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="order-2 flex flex-col justify-center sm:order-1">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
              <Sprout size={20} />
            </div>
            <p className="text-[15px] font-bold text-ink">What should we call you?</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anand Rao"
              aria-label="Your name"
              maxLength={40}
              className="mt-3 w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13.5px] font-semibold text-ink ring-1 ring-inset ring-line transition placeholder:font-normal placeholder:text-faint focus:ring-brand"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setStep(1)
              }}
            />
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Appears on your profile menu only. Your data stays on this device — no account needed.
            </p>
          </div>
          <div className="order-1 grid grid-cols-2 content-center gap-2.5 sm:order-2">
            {SLIDES.map((s) => (
              <div key={s.title} className="rounded-xl bg-surface-2/70 p-3 ring-1 ring-inset ring-line">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
                  <s.icon size={15} />
                </div>
                <p className="mt-2 text-[12px] font-bold leading-snug text-ink">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
            {slide.icon && <slide.icon size={20} />}
          </div>
          <p className="text-[15px] font-bold text-ink">{slide.title}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{slide.body}</p>
        </motion.div>
      )}
    </Dialog>
  )
}

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { ANALYSIS_STAGES } from '../../services/cropAnalysisService'
import { cn } from '../../utils'

/**
 * Staged analysis sequence. Deliberately transparent: each stage line reflects
 * what the local engine does. ~2.2s total, paced for visibility.
 */
export function AnalysisStages({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers: number[] = []
    const gaps = [520, 520, 520, 640]
    let acc = 0
    for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
      acc += gaps[i]
      timers.push(window.setTimeout(() => setStep(i + 1), acc))
    }
    const doneT = window.setTimeout(onDone, acc + 350)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(doneT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-md py-6" aria-live="polite">
      <div className="relative mx-auto mb-8 h-1.5 w-56 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          initial={{ width: '4%' }}
          animate={{ width: '96%' }}
          transition={{ duration: 2.4, ease: 'easeInOut' }}
        />
      </div>
      <ul className="space-y-3.5">
        {ANALYSIS_STAGES.map((s, i) => {
          const state = step > i ? 'done' : step === i ? 'active' : 'pending'
          return (
            <li key={s.id} className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset transition-colors duration-200',
                  state === 'done' && 'bg-brand text-on-brand ring-brand',
                  state === 'active' && 'bg-brand-soft text-brand ring-brand/40',
                  state === 'pending' && 'bg-surface text-faint ring-line',
                )}
              >
                {state === 'done' ? (
                  <Check size={13} />
                ) : state === 'active' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <span aria-hidden className="text-[10px] font-bold">{i + 1}</span>
                )}
              </span>
              <div>
                <p className={cn('text-[13.5px] font-bold leading-snug', state === 'pending' ? 'text-faint' : 'text-ink')}>{s.label}</p>
                <AnimatePresence>
                  {state === 'active' && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[11.5px] text-muted">
                      {s.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-6 text-center text-[11.5px] text-faint">
        Local analysis stage — timings are paced for visibility.
      </p>
    </div>
  )
}

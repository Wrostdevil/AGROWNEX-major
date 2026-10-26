import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils'

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[]
  activeId: string
  onChange: (id: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export function Tabs({ tabs, activeId, onChange, size = 'md', className }: TabsProps) {
  const layoutId = useId()
  return (
    <div role="tablist" aria-label="Views" className={cn('inline-flex items-center gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-inset ring-line', className)}>
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg px-3.5 font-semibold transition-colors duration-150',
              size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-[13px]',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${layoutId}`}
                className="absolute inset-0 rounded-lg bg-surface shadow-card ring-1 ring-inset ring-line"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Segmented control (small filter pills)
// ---------------------------------------------------------------------------

export interface SegmentedProps<T extends string> {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
  ariaLabel: string
}

export function Segmented<T extends string>({ options, value, onChange, className, ariaLabel }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex flex-wrap items-center gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-inset ring-line', className)}
    >
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
              active ? 'bg-surface text-ink shadow-card ring-1 ring-inset ring-line' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stepper (guided workflows)
// ---------------------------------------------------------------------------

export interface StepperProps {
  steps: string[]
  current: number // 0-based; for analysis flows, current === steps.length means "done"
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center gap-0', className)} aria-label="Progress">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'pending'
        return (
          <li key={step} className="flex items-center last:flex-1">
            <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2">
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ring-1 ring-inset transition-colors',
                  state === 'done' && 'bg-brand text-on-brand ring-brand',
                  state === 'active' && 'bg-brand-soft text-brand ring-brand/40',
                  state === 'pending' && 'bg-surface text-faint ring-line',
                )}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'mt-1 text-center text-[11px] font-semibold sm:mt-0',
                  state === 'pending' ? 'text-faint' : 'text-ink',
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-2 h-px flex-1 sm:mx-3', i < current ? 'bg-brand' : 'bg-line')} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-shimmer rounded-lg bg-surface-3', className)} aria-hidden />
}

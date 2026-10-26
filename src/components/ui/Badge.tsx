import type { ReactNode } from 'react'
import { cn } from '../../utils'

type Tone = 'neutral' | 'brand' | 'caution' | 'danger' | 'outline' | 'dark'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted ring-line',
  brand: 'bg-brand-soft text-brand ring-brand/20',
  caution: 'bg-caution-soft text-caution ring-caution/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  outline: 'bg-surface text-muted ring-line-strong',
  dark: 'bg-forest-900 text-sage-300 ring-white/15',
}

export interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
  icon?: ReactNode
  /** Renders a leading status dot (never the only status signal). */
  dot?: boolean
}

export function Badge({ tone = 'neutral', children, className, icon, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  )
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('kicker text-brand', className)}>{children}</p>
}

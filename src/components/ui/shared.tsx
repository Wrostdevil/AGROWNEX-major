import type { ReactNode } from 'react'
import { cn } from '../../utils'

// ---------------------------------------------------------------------------
// Section heading + empty state + note blocks
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  description,
  actions,
  chip,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  chip?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">{title}</h1>
          {chip}
        </div>
        {description && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = 'left',
  className,
}: {
  kicker?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {kicker && <p className="kicker text-brand">{kicker}</p>}
      <h2 className="mt-2 text-[26px] font-extrabold tracking-tight text-ink sm:text-[34px]">{title}</h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center', className)}>
      {icon && (
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">{icon}</div>
      )}
      <p className="text-[15px] font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function NoteBlock({
  tone = 'info',
  title,
  children,
  icon,
  className,
}: {
  tone?: 'info' | 'caution' | 'danger' | 'brand'
  title?: string
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  const tones = {
    info: 'bg-surface-2 text-muted ring-line',
    brand: 'bg-brand-soft text-ink ring-brand/20',
    caution: 'bg-caution-soft text-caution ring-caution/25',
    danger: 'bg-danger-soft text-danger ring-danger/20',
  } as const
  return (
    <div className={cn('flex gap-3 rounded-xl px-4 py-3.5 ring-1 ring-inset', tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="text-[13px] leading-relaxed">
        {title && <p className="mb-0.5 text-[13px] font-bold">{title}</p>}
        {children}
      </div>
    </div>
  )
}

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { interactive?: boolean; tone?: 'plain' | 'dark' | 'brand' }>(function Card(
  { className, interactive, tone = 'plain', children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-2xl',
        tone === 'plain' && 'bg-surface ring-1 ring-inset ring-line shadow-card',
        tone === 'dark' && 'bg-forest-900 text-ivory shadow-lift ring-1 ring-inset ring-white/10',
        tone === 'brand' && 'bg-brand-soft text-ink ring-1 ring-inset ring-brand/15',
        interactive &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:ring-line-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-3', className)}>
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-brand">{icon}</div>}
        <div>
          <h3 className="text-[15px] font-bold leading-snug text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>
}

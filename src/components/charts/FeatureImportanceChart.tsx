import { motion } from 'framer-motion'
import { cn } from '../../utils'

/**
 * ExplanationFeatureChart — diverging feature-importance bars.
 *
 * Pure SVG + framer-motion so contributions can animate entry-by-entry and be
 * keyboard selectable. Positive ("supports the pattern") vs negative
 * ("pulls against") sums are shown with distinct hues AND explicit direction
 * text, so color is never the only signal.
 */
export function FeatureImportanceChart({
  features,
  selectedKey,
  onSelect,
  className,
}: {
  features: { key: string; label: string; contribution: number; direction: 'supports' | 'against' }[]
  selectedKey?: string
  onSelect?: (key: string) => void
  className?: string
}) {
  const max = Math.max(...features.map((f) => Math.abs(f.contribution)), 0.5)

  return (
    <div className={cn('select-none', className)} role="group" aria-label="Feature contribution chart">
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted">
        <span aria-hidden>Toward condition →</span>
        <span aria-hidden>← Against condition</span>
      </div>
      <div className="space-y-1.5">
        {features.map((f, i) => {
          const positive = f.direction === 'supports'
          const widthPct = (Math.abs(f.contribution) / max) * 46
          const selected = f.key === selectedKey
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onSelect?.(f.key)}
              aria-pressed={selected}
              className={cn(
                'group grid w-full grid-cols-[190px_1fr_52px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                selected ? 'bg-brand-soft' : 'hover:bg-surface-2/80',
              )}
            >
              <span className={cn('truncate text-[12.5px] font-semibold', selected ? 'text-brand' : 'text-ink group-hover:text-ink')} title={f.label}>
                {f.label}
              </span>
              <span className="relative h-[22px]" aria-hidden>
                {/* centre axis */}
                <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'absolute inset-y-[3px] rounded-md',
                    positive ? 'bg-gradient-to-l from-[#B84A43] to-[#C86A5F]' : 'bg-gradient-to-r from-[#267A56] to-[#2F8C64]',
                  )}
                  style={positive ? { left: '50%' } : { right: '50%' }}
                />
              </span>
              <span className={cn('tabular text-right text-[12px] font-bold', positive ? 'text-danger' : 'text-brand')}>
                {f.contribution > 0 ? '+' : ''}
                {f.contribution.toFixed(2)}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[#B84A43]" /> Supports the displayed pattern
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[#267A56]" /> Pulls against it
        </span>
        <span className="text-faint">(attributed weights)</span>
      </div>
    </div>
  )
}

/** Compact confidence ring. */
export function ConfidenceRing({ value, size = 92, label }: { value: number; size?: number; label?: string }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filled = c * Math.min(1, Math.max(0, value))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s-surface-3)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--s-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${filled} ${c}` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="tabular text-[17px] font-extrabold leading-none text-ink">{Math.round(value * 100)}%</p>
          {label && <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-faint">{label}</p>}
        </div>
      </div>
    </div>
  )
}

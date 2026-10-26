import { cn } from '../../utils'

/** Agrownex leaf-spark mark. Original brand symbol, no emoji. */
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      <defs>
        <linearGradient id="agx-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F8C64" />
          <stop offset="1" stopColor="#173D32" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="#102A24" />
      <path
        d="M32 51 C 17.5 44.5, 13.5 30, 18 16.5 C 20 15 22.3 14.6 24.8 14.6 C 40.4 14.6, 48.6 24.2, 48 40.3 C 47.8 44.9 45.4 48.4 41.6 49.8 C 38.4 51 34.9 51.2 32 51 Z"
        fill="url(#agx-leaf)"
      />
      <path d="M21.5 47 C 26.5 38.5, 34 30.5, 44.5 22" stroke="#A9C8A8" strokeWidth="2.3" strokeLinecap="round" fill="none" />
      <path d="M29.5 34.5 C 32.2 35.4, 35.4 35, 37.6 33" stroke="#A9C8A8" strokeWidth="1.9" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M24.5 41.5 C 27.2 42.4, 30.4 42, 32.6 40" stroke="#A9C8A8" strokeWidth="1.9" strokeLinecap="round" fill="none" opacity="0.7" />
      <circle cx="45.5" cy="17" r="3.4" fill="#C58B36" />
    </svg>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="text-[19px] font-extrabold tracking-tight">
          <span className="text-ink dark:text-ivory">Agrow</span>
          <span className="text-brand">Nex</span>
        </span>
      )}
    </span>
  )
}

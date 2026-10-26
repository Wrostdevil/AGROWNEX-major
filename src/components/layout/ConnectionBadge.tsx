import { useEffect, useState } from 'react'
import { Database, CircleSlash, Cpu, Leaf, Loader2 } from 'lucide-react'
import { cn } from '../../utils'
import { apiHealth, type HealthResponse } from '../../services/api/endpoints'

type Status = 'checking' | 'api-down' | 'db-down' | 'model-missing' | 'ready'

interface Snapshot {
  status: Status
  health?: HealthResponse
  error?: string
}

/**
 * ConnectionBadge — polls GET /api/health and tells the truth about which
 * parts of the local stack are up (API, MongoDB, trained model). It never
 * pretends the stack is fully working: a missing database or untrained model
 * shows an amber state with the exact remediation command on hover/click.
 */
export function ConnectionBadge({ onDone }: { onDone?: (snapshotStatus: Status) => void }) {
  const [snap, setSnap] = useState<Snapshot>({ status: 'checking' })

  useEffect(() => {
    let cancelled = false

    const poll = () => {
      apiHealth()
        .then((h: HealthResponse) => {
          if (cancelled) return
          const status: Status =
            !h.api.up
              ? 'api-down'
              : !h.db.ready
                ? 'db-down'
                : !h.ml.trained
                  ? 'model-missing'
                  : 'ready'
          setSnap({ status, health: h })
          onDone?.(status)
        })
        .catch((err: unknown) => {
          if (cancelled) return
          setSnap({ status: 'api-down', error: err instanceof Error ? err.message : String(err) })
          onDone?.('api-down')
        })
    }

    void poll()
    const timer = window.setInterval(poll, 45_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
    // onDone intentionally excluded: poll identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const label: Record<Status, string> = {
    checking: 'Checking backend…',
    'api-down': 'Backend offline',
    'db-down': 'DB not connected',
    'model-missing': 'Model not trained',
    ready: 'Full stack live',
  }
  const dot: Record<Status, string> = {
    checking: 'bg-faint',
    'api-down': 'bg-danger',
    'db-down': 'bg-caution',
    'model-missing': 'bg-caution',
    ready: 'bg-brand',
  }

  const h = snap.health
  const detail = snap.error ?? h?.db.message ?? 'querying /api/health'
  const setup =
    snap.status === 'api-down'
      ? 'cd backend && npm run dev'
      : snap.status === 'db-down'
        ? 'Set MONGODB_URI in backend/.env, then restart: npm run dev'
        : snap.status === 'model-missing'
          ? (h?.ml.instructions ?? 'cd ml-service && python -m training.make_fixture && python -m training.train')
          : ''

  return (
    <div className="group relative">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
          snap.status === 'ready'
            ? 'bg-brand-soft text-brand ring-brand/25'
            : snap.status === 'checking'
              ? 'bg-surface-2 text-muted ring-line'
              : 'bg-caution-soft text-caution ring-caution/30',
        )}
        title={`${label[snap.status]} — ${detail}${setup ? ` • setup: ${setup}` : ''}`}
      >
        {snap.status === 'checking' ? <Loader2 size={11} className="animate-spin" aria-hidden /> : <span className={cn('h-1.5 w-1.5 rounded-full', dot[snap.status])} aria-hidden />}
        {label[snap.status]}
      </span>
      {snap.status !== 'checking' && (
        <div
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-50 hidden w-64 rounded-xl border border-line bg-surface p-3 shadow-lift group-hover:block"
          role="tooltip"
        >
          <p className="text-[12px] font-bold text-ink">Stack status</p>
          <ul className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed text-muted">
            <li className="flex items-center gap-1.5">
              <Leaf size={11} className={h?.api.up ? 'text-brand' : 'text-faint'} /> API {h?.api.up ? ' live' : ' offline'}
            </li>
            <li className="flex items-center gap-1.5">
              <Database size={11} className={h?.db.ready ? 'text-brand' : 'text-faint'} /> DB {h?.db.ready ? ' connected' : ' unreachable'}
            </li>
            <li className="flex items-center gap-1.5">
              <Cpu size={11} className={h?.ml.trained ? 'text-brand' : 'text-faint'} /> Model {h?.ml.trained ? ' trained' : ' artifacts missing'}
            </li>
          </ul>
          {setup && <p className="mt-2 rounded-lg bg-surface-2 px-2 py-1.5 font-mono text-[10.5px] text-ink">{setup}</p>}
        </div>
      )}
    </div>
  )
}

/** Compact disabled stack notice for the sidebar footer when API is absent. */
export function StackStatusRow({ status }: { status: Status }) {
  if (status === 'api-down') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
        <CircleSlash size={13} className="text-caution" aria-hidden /> local storage only
      </span>
    )
  }
  return null
}

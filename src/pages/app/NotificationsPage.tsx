import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BellOff,
  Bot,
  CheckCheck,
  MessagesSquare,
  Radar,
  Trash2,
  X,
} from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock, EmptyState } from '../../components/ui/shared'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Segmented } from '../../components/ui/extra'
import { useToast } from '../../components/ui/toast'
import {
  markAllNotificationsRead,
  removeNotification,
  toggleNotificationRead,
  useNotifications,
} from '../../services/notificationService'
import type { NotificationKind } from '../../types'
import { formatDateTime, formatShortDate } from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type UnreadFilter = 'all' | 'unread'
type KindFilter = 'all' | NotificationKind

const KIND_META: Record<NotificationKind, { label: string; icon: React.ReactNode; tone: 'brand' | 'caution' | 'danger' | 'neutral' }> = {
  'community-watch': { label: 'Community watches', icon: <Radar size={14} />, tone: 'caution' },
  'analysis-complete': { label: 'Assessments', icon: <Bot size={14} />, tone: 'brand' },
  'comparison-saved': { label: 'Saved comparisons', icon: <MessagesSquare size={14} />, tone: 'neutral' },
  reminder: { label: 'Reminders', icon: <BellOff size={14} />, tone: 'danger' },
}

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: 'all', label: 'All kinds' },
  { id: 'community-watch', label: 'Community' },
  { id: 'analysis-complete', label: 'Assessments' },
  { id: 'comparison-saved', label: 'Comparisons' },
  { id: 'reminder', label: 'Reminders' },
]

export function NotificationsPage() {
  usePageTitle('Notifications')
  const { toast } = useToast()
  const notifications = useNotifications()

  const [unreadOnly, setUnreadOnly] = useState<UnreadFilter>('all')
  const [kind, setKind] = useState<KindFilter>('all')
  const [clearAllOpen, setClearAllOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const { visible, kindCounts } = useMemo(() => {
    let list = notifications
    if (unreadOnly === 'unread') list = list.filter((n) => !n.read)
    if (kind !== 'all') list = list.filter((n) => n.kind === kind)
    const kindCounts: Record<NotificationKind, number> = {
      'community-watch': notifications.filter((n) => n.kind === 'community-watch').length,
      'analysis-complete': notifications.filter((n) => n.kind === 'analysis-complete').length,
      'comparison-saved': notifications.filter((n) => n.kind === 'comparison-saved').length,
      reminder: notifications.filter((n) => n.kind === 'reminder').length,
    }
    return { visible: list, kindCounts }
  }, [notifications, unreadOnly, kind])

  function handleMarkAll() {
    markAllNotificationsRead()
    toast({ kind: 'success', title: 'All marked as read', body: 'The topbar badge clears with the same store.' })
  }

  function handleClearAll() {
    for (const n of notifications) removeNotification(n.id)
    setClearAllOpen(false)
    toast({ kind: 'info', title: 'Feed cleared', body: 'Starter notices return after Settings → Reset workspace data.' })
  }

  return (
    <>
      <PageHeader
        title="Notification centre"
        description="A local feed: community watches, assessment notes and saved-comparison pings — all generated inside this browser."
        actions={
          <>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAll} leadingIcon={<CheckCheck size={15} />}>
                Mark all as read
              </Button>
            )}
            <Button variant="ghost" onClick={() => setClearAllOpen(true)} leadingIcon={<Trash2 size={15} />}>
              Clear feed
            </Button>
          </>
        }
      />

      {/* Controls */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Segmented
            ariaLabel="Read status filter"
            value={unreadOnly}
            onChange={setUnreadOnly}
            options={[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {KIND_FILTERS.map((k) => {
                const active = kind === k.id
                const count = k.id === 'all' ? notifications.length : kindCounts[k.id]
                return (
                  <button
                    key={k.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setKind(k.id)}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold ring-1 ring-inset transition',
                      active ? 'bg-brand text-on-brand ring-brand' : 'bg-surface-2 text-muted ring-line hover:text-ink',
                    )}
                  >
                    {k.label} · {count}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Feed */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<BellOff size={18} />}
          title={unreadOnly === 'unread' ? 'Nothing unread here' : 'No notifications match'}
          description={
            unreadOnly === 'unread'
              ? 'New entries land as you use the workspace — run a diagnosis or save a comparison.'
              : 'Loosen the kind filter, or reset workspace data in Settings to restore the starter notices.'
          }
          action={
            unreadOnly === 'unread' ? (
              <Button variant="outline" onClick={() => setUnreadOnly('all')}>Show all</Button>
            ) : (
              <Button variant="outline" onClick={() => setKind('all')}>Show every kind</Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {visible.map((n, i) => (
            <motion.li key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.18), ease }}>
              <Card
                className={cn(
                  'flex flex-col gap-3 px-4.5 py-4 sm:flex-row sm:items-start',
                  !n.read && 'ring-brand/30',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset',
                    !n.read ? 'bg-brand-soft text-brand ring-brand/20' : 'bg-surface-2 text-faint ring-line',
                  )}
                >
                  {KIND_META[n.kind].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn('text-[13.5px]', n.read ? 'font-semibold text-muted' : 'font-bold text-ink')}>
                      <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle', n.read ? 'bg-faint' : 'bg-brand')} aria-hidden />
                      {n.title}
                    </p>
                    <Badge tone={n.sample ? 'outline' : 'brand'}>{n.sample ? 'starter' : 'you'}</Badge>
                    <Badge tone={KIND_META[n.kind].tone}>{KIND_META[n.kind].label.replace(/s$/, '')}</Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{n.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="text-[11px] text-faint" title={formatDateTime(n.createdAt)}>
                      {formatShortDate(n.createdAt)}
                    </span>
                    {n.link && (
                      <Link
                        to={n.link.to}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-brand hover:underline"
                      >
                        {n.link.label}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleNotificationRead(n.id)}
                      className="text-[12px] font-semibold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Mark as {n.read ? 'unread' : 'read'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNotification(n.id)}
                      aria-label={`Delete notification: ${n.title}`}
                      title="Delete notification"
                      className="rounded-md p-1 text-faint transition hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {n.link && (
                  <Link
                    to={n.link.to}
                    aria-label={n.link.label}
                    className="hidden shrink-0 rounded-xl p-2 text-muted ring-1 ring-inset ring-line transition hover:bg-surface-2 hover:text-ink sm:grid sm:place-items-center max-sm:hidden"
                  >
                    <CheckCheck size={16} />
                  </Link>
                )}
              </Card>
            </motion.li>
          ))}
        </ul>
      )}

      <NoteBlock className="mt-6" tone="info" title="Where the starter notices come from">
        Seeding places five starter entries so the feed, topbar badge and overview stat all behave
        realistically from first run. This feed resets with the other workspace stores.
      </NoteBlock>

      {/* Clear-all dialog */}
      <Dialog
        open={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        title="Clear the whole feed?"
        description="Every entry — read, unread, starter or yours — is removed."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setClearAllOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClearAll} leadingIcon={<X size={14} />}>
              Clear {notifications.length} item{notifications.length === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-muted">
          This empties the local feed only. Starter notices return via{' '}
          <strong className="text-ink">Settings → Reset workspace data</strong>.
        </p>
      </Dialog>
    </>
  )
}

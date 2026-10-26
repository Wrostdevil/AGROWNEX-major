import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  Bot,
  Clock,
  History,
  Lightbulb,
  Map,
  MessagesSquare,
  Radar,
  ScanLine,
  Sparkles,
  Stethoscope,
  Wallet,
} from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { Card } from '../../components/ui/Card'
import { LinkButton } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState, NoteBlock, PageHeader } from '../../components/ui/shared'
import { Skeleton } from '../../components/ui/extra'
import { TrendAreaChart } from '../../components/charts/TrendAreaChart'
import { useHistory } from '../../services/historyService'
import { useNotifications } from '../../services/notificationService'
import { useSavedComparisons } from '../../services/savedComparisons'
import { useCommunityReports } from '../../services/communityService'
import { useFields } from '../../services/fieldService'
import { listSampleAlerts } from '../../data/community'
import { getSeries } from '../../data/community'
import { cropName, REGIONS } from '../../data/catalog'
import { AlertLevel } from '../../types'
import { cn } from '../../utils'
import { relativeTime, formatShortDate } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function DashboardPage() {
  usePageTitle('Overview dashboard')
  const history = useHistory()
  const notifications = useNotifications()
  const saved = useSavedComparisons()
  const reports = useCommunityReports()
  const fields = useFields()

  // Brief loading state for chart/stat hydration.
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(t)
  }, [])

  const [regionId, setRegionId] = useState('north')
  const series = useMemo(() => getSeries(regionId, 'tomato', 'leaf-brown-spots'), [regionId])
  const sampleAlerts = useMemo(() => listSampleAlerts(regionId), [regionId])
  const trendStatus = useMemo(() => {
    const recent = series.slice(-4).reduce((s, p) => s + p.count, 0)
    const prior = series.slice(0, -4).reduce((s, p) => s + p.count, 0)
    const ratio = prior > 0 ? recent / 4 / (prior / 8) : 1
    return ratio >= 1.6 ? 'attention' : ratio >= 1.22 ? 'watch' : 'steady'
  }, [series])

  const recentAssessments = history.slice(0, 4)
  const activity = useMemo(
    () =>
      [
        ...history.slice(0, 3).map((h) => ({ ts: h.createdAt, label: `Assessment recorded — ${h.cropName}`, meta: h.conditionName, to: `/app/history` })),
        ...notifications.slice(0, 3).map((n) => ({ ts: n.createdAt, label: n.kind === 'community-watch' ? 'Community watch' : n.kind === 'analysis-complete' ? 'Analysis complete' : n.kind === 'comparison-saved' ? 'Comparison saved' : 'Scouting reminder', meta: n.title, to: '/app/notifications' })),
        ...reports.slice(0, 2).map((r) => ({ ts: r.createdAt, label: r.sample ? 'Starter community report' : 'Your community report', meta: `${cropName(r.cropId)} · ${REGIONS.find((x) => x.id === r.regionId)?.name}`, to: '/app/community' })),
        ...fields.flatMap((f) => f.observations.slice(0, 1).map((o) => ({ ts: new Date(o.observedOn + 'T09:00:00').getTime(), label: `Field observation — ${f.name}`, meta: o.note, to: '/app/fields' }))),
      ]
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 7),
    [history, notifications, reports, fields],
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <PageHeader
        title={`${greeting}. Let's understand what's happening in your fields.`}
        description="A live summary of this workspace: recent assessments, community movement and what to look at next."
        actions={
          <>
            <LinkButton to="/app/diagnosis" leadingIcon={<Stethoscope size={16} />}>
              Start new diagnosis
            </LinkButton>
            <LinkButton to="/app/assistant" variant="outline" leadingIcon={<Bot size={16} />}>
              Ask the farming assistant
            </LinkButton>
          </>
        }
      />

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          loading={loading}
          icon={<ScanLine size={17} />}
          label="Recent crop assessments"
          value={String(history.length)}
          sub="assessments recorded"
          to="/app/history"
        />
        <StatCard
          loading={loading}
          icon={<Radar size={17} />}
          label="Watch alerts"
          value={String(sampleAlerts.length)}
          sub="watch or attention level"
          to="/app/community"
        />
        <StatCard
          loading={loading}
          icon={<Wallet size={17} />}
          label="Saved treatment comparisons"
          value={String(saved.length)}
          sub="saved on this device"
          to="/app/treatments"
        />
        <StatCard
          loading={loading}
          icon={<Radar size={17} />}
          label="Community trend status"
          value={trendStatus === 'attention' ? 'Attention' : trendStatus === 'watch' ? 'Watch' : 'Steady'}
          sub="North District · tomato"
          to="/app/community"
          tone={trendStatus === 'attention' ? 'danger' : trendStatus === 'watch' ? 'caution' : 'brand'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2">
              <div>
                <h3 className="text-[15px] font-bold text-ink">Community report trend</h3>
                <p className="mt-0.5 text-[12.5px] text-muted">Dark-spot reports on tomato · 12-week window</p>
              </div>
              <select
                aria-label="Choose region"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="rounded-xl bg-surface-2 px-3 py-2 text-[12.5px] font-semibold text-ink ring-1 ring-inset ring-line"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="px-3 pb-4">
              {loading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <TrendAreaChart data={series.map((p) => ({ label: p.label, count: p.count }))} height={220} ariaLabel="Weekly community reports, dark spots on tomato" />
              )}
            </div>
            <div className="px-5 pb-5">
              <p className="text-[11.5px] leading-relaxed text-faint">
                Starter dataset — counts update as reports come in. A sustained rise suggests increased
                observation activity, not a confirmed outbreak.
              </p>
              <Link to="/app/community" className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand">
                Open early-warning centre <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <History size={17} className="text-brand" aria-hidden />
                <h3 className="text-[15px] font-bold text-ink">Recent assessments</h3>
              </div>
              <Link to="/app/history" className="text-[12.5px] font-bold text-brand">View all</Link>
            </div>
            {recentAssessments.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={<ScanLine size={18} />}
                  title="No assessments yet"
                  description="Run the guided diagnosis to create your first assessment."
                  action={<LinkButton to="/app/diagnosis" size="sm">Start a diagnosis</LinkButton>}
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {recentAssessments.map((h) => (
                  <li key={h.id}>
                    <Link to={`/app/explanations?analysis=${h.id}`} className="group flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-surface-2/60">
                      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset', h.risk === 'elevated' ? 'bg-danger-soft text-danger ring-danger/15' : h.risk === 'moderate' ? 'bg-caution-soft text-caution ring-caution/15' : 'bg-brand-soft text-brand ring-brand/15')}>
                        <Stethoscope size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-ink">{h.cropName} · {h.conditionName}</p>
                        <p className="mt-0.5 text-[12px] text-muted">{formatShortDate(h.createdAt)} · {Math.round(h.confidence * 100)}% confidence{h.source === 'sample' ? ' · starter' : ''}</p>
                      </div>
                      <Badge tone={h.risk === 'elevated' ? 'danger' : h.risk === 'moderate' ? 'caution' : 'brand'} dot>
                        {h.risk}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
              <Clock size={16} className="text-brand" aria-hidden />
              <h3 className="text-[15px] font-bold text-ink">Activity timeline</h3>
            </div>
            <div className="px-5 pb-5">
              <ol className="relative space-y-3.5 border-l border-line pl-4">
                {activity.map((a, i) => (
                  <li key={`${a.label}-${i}`} className="relative">
                    <span aria-hidden className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand/70 ring-4 ring-surface" />
                    <Link to={a.to} className="block text-[13px] font-semibold text-ink hover:text-brand">
                      {a.label}
                    </Link>
                    <p className="truncate text-[12px] text-muted">{a.meta}</p>
                    <p className="text-[11px] text-faint">{relativeTime(a.ts)}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card tone="dark" className="overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-2 text-sage-300">
                <Sparkles size={16} aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Assistant quick access</p>
              </div>
              <p className="mt-2 text-[14.5px] font-bold text-ivory">Ask about symptoms, budgets or the watch alerts</p>
              <div className="mt-3 space-y-2">
                {['Help me understand these crop symptoms', 'Compare suitable options within my budget', 'Show me the community watch alerts'].map((q) => (
                  <Link key={q} to={`/app/assistant?q=${encodeURIComponent(q)}`} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.07] px-3.5 py-2.5 text-[12.5px] font-semibold text-ivory/95 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.12]">
                    <MessagesSquare size={14} className="shrink-0 text-sage-400" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{q}</span>
                    <ArrowRight size={13} className="shrink-0 text-sage-400" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
              <Bell size={16} className="text-brand" aria-hidden />
              <h3 className="text-[15px] font-bold text-ink">Watch alerts</h3>
            </div>
            <div className="space-y-2.5 px-5 pb-5">
              {sampleAlerts.slice(0, 3).map((a) => (
                <Link key={a.id} to="/app/community" className="block rounded-xl bg-surface-2/70 px-3.5 py-3 ring-1 ring-inset ring-line transition hover:bg-surface-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-bold text-ink">{cropName(a.cropId)} · {REGIONS.find((r) => r.id === a.regionId)?.name}</p>
                    <AlertLevelBadge level={a.level} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{a.trendSummary}</p>
                </Link>
              ))}
              <p className="text-[11px] text-faint">Starter data — open the centre for detail views and uncertainty notes.</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
              <Lightbulb size={16} className="text-brand" aria-hidden />
              <h3 className="text-[15px] font-bold text-ink">Quick actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5 px-5 pb-5">
              {[
                { to: '/app/diagnosis', label: 'New diagnosis', icon: Stethoscope },
                { to: '/app/treatments', label: 'Plan treatments', icon: Wallet },
                { to: '/app/fields', label: 'Add field record', icon: Map },
                { to: '/app/history', label: 'Review history', icon: History },
              ].map((a) => (
                <Link key={a.label} to={a.to} className="group flex flex-col gap-2 rounded-xl bg-surface-2/60 px-3.5 py-3 ring-1 ring-inset ring-line transition hover:bg-brand-soft">
                  <a.icon size={16} className="text-brand" aria-hidden />
                  <span className="text-[12.5px] font-bold text-ink">{a.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <NoteBlock icon={null} tone="info">
            Counts across the workspace are internally consistent starter data. Reset or export them
            in Settings.
          </NoteBlock>
        </div>
      </div>
    </>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  to,
  loading,
  tone = 'plain',
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  to: string
  loading?: boolean
  tone?: 'plain' | 'brand' | 'caution' | 'danger'
}) {
  const toneRing = {
    plain: 'bg-brand-soft text-brand',
    brand: 'bg-brand-soft text-brand',
    caution: 'bg-caution-soft text-caution',
    danger: 'bg-danger-soft text-danger',
  }[tone]
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
      <Link to={to} className="block rounded-2xl bg-surface p-4.5 shadow-card ring-1 ring-inset ring-line transition hover:-translate-y-0.5 hover:shadow-lift">
        <div className="flex items-center gap-2.5">
          <span className={cn('grid h-8 w-8 place-items-center rounded-lg ring-1 ring-inset ring-line', toneRing)} aria-hidden>{icon}</span>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-faint">{label}</p>
        </div>
        {loading ? (
          <Skeleton className="mt-2.5 h-8 w-16" />
        ) : (
          <p className="tabular mt-2 text-[26px] font-extrabold leading-none text-ink">{value}</p>
        )}
        <p className="mt-1.5 text-[11.5px] text-muted">{sub}</p>
      </Link>
    </motion.div>
  )
}

function AlertLevelBadge({ level }: { level: AlertLevel }) {
  return (
    <Badge tone={level === 'attention' ? 'danger' : level === 'watch' ? 'caution' : 'brand'} dot>
      {level === 'attention' ? 'attention' : level === 'watch' ? 'watch' : 'steady'}
    </Badge>
  )
}

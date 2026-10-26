import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Eye,
  RotateCcw,
  ScanLine,
  Search,
  Trash2,
} from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock, EmptyState } from '../../components/ui/shared'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button, LinkButton } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Input, Select } from '../../components/ui/inputs'
import { useToast } from '../../components/ui/toast'
import {
  removeHistory,
  useHistory,
} from '../../services/historyService'
import { CROPS } from '../../data/catalog'
import type { AnalysisHistoryRecord } from '../../types'
import { formatDateTime } from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type RiskFilter = 'all' | 'low' | 'moderate' | 'elevated'
type StatusFilter = 'all' | 'complete' | 'incomplete'

export function HistoryPage() {
  usePageTitle('Assessment history')
  const { toast } = useToast()
  const history = useHistory()

  const [query, setQuery] = useState('')
  const [cropId, setCropId] = useState('all')
  const [risk, setRisk] = useState<RiskFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sortDir, setSortDir] = useState<'newest' | 'oldest'>('newest')
  const [pendingDelete, setPendingDelete] = useState<AnalysisHistoryRecord | null>(null)
  const [detail, setDetail] = useState<AnalysisHistoryRecord | null>(null)

  const filtered = useMemo(() => {
    let list = history
    if (cropId !== 'all') list = list.filter((r) => r.cropId === cropId)
    if (risk !== 'all') list = list.filter((r) => r.risk === risk)
    if (status !== 'all') list = list.filter((r) => r.status === status)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.cropName.toLowerCase().includes(q) ||
          r.conditionName.toLowerCase().includes(q) ||
          r.label.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => (sortDir === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))
  }, [history, query, cropId, risk, status, sortDir])

  const activeFilters =
    Number(cropId !== 'all') + Number(risk !== 'all') + Number(status !== 'all') + Number(query.trim() !== '')

  function resetFilters() {
    setQuery('')
    setCropId('all')
    setRisk('all')
    setStatus('all')
    setSortDir('newest')
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const wasSample = pendingDelete.source === 'sample'
    removeHistory(pendingDelete.id)
    setPendingDelete(null)
    toast({
      kind: 'info',
      title: 'Assessment deleted',
      body: wasSample
        ? 'Starter record recovered any time via Settings → Reset workspace data.'
        : 'Record removed from this device.',
    })
  }

  return (
    <>
      <PageHeader
        title="Assessment history"
        description="Every assessment this workspace has produced — searchable, filterable, deletable. Records with full detail link straight into the explanation view."
        actions={
          <LinkButton to="/app/diagnosis" leadingIcon={<ScanLine size={16} />}>
            New assessment
          </LinkButton>
        }
      />

      {/* Filter bar */}
      <Card className="mb-5">
        <div className="px-5 py-4">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" aria-hidden />
            <Input
              aria-label="Search assessments"
              className="pl-9.5"
              placeholder="Search crop, pattern or label…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p aria-live="polite" className="mt-2 text-[11.5px] text-faint">
            {filtered.length} assessment{filtered.length === 1 ? '' : 's'} match the current filters
          </p>
        </div>
        <div className="grid gap-3 border-t border-line px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-faint">Crop</span>
            <Select value={cropId} onChange={(e) => setCropId(e.target.value)} className="py-2 text-[13px]">
              <option value="all">All crops</option>
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-faint">Risk band</span>
            <Select value={risk} onChange={(e) => setRisk(e.target.value as RiskFilter)} className="py-2 text-[13px]">
              <option value="all">All bands</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="elevated">Elevated</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-faint">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="py-2 text-[13px]">
              <option value="all">All statuses</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-faint">Sort</span>
            <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'newest' | 'oldest')} className="py-2 text-[13px]">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </label>
        </div>
        {activeFilters > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/50 px-5 py-2.5">
            <p className="text-[12px] font-semibold text-muted">
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} active · {filtered.length} of {history.length} shown
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-bold text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <RotateCcw size={12} aria-hidden />
              Clear filters
            </button>
          </div>
        )}
      </Card>

      {/* List */}
      {history.length === 0 ? (
        <EmptyState
          icon={<ScanLine size={18} />}
          title="No assessments recorded"
          description="The history fills up as you run the guided diagnosis. Starter records return after a workspace reset."
          action={<LinkButton to="/app/diagnosis">Run the first diagnosis</LinkButton>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ScanLine size={18} />}
          title="Nothing matches these filters"
          description="Try clearing the search or widening the crop and band filters."
          action={<Button variant="outline" onClick={resetFilters} leadingIcon={<RotateCcw size={14} />}>Clear filters</Button>}
        />
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {filtered.map((h, i) => (
            <motion.li
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.2), ease }}
            >
              <HistoryRow
                record={h}
                onPreview={() => setDetail(h)}
                onDelete={() => setPendingDelete(h)}
              />
            </motion.li>
          ))}
        </ul>
      )}

      <NoteBlock className="mt-6" tone="info" title="About these records">
        Entries are stored locally on this device. "Starter" rows come pre-seeded; your own
        rows appear with a "you" tag after running a diagnosis. No cloud sync exists anywhere in this build.
      </NoteBlock>

      {/* Preview dialog */}
      <Dialog
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={`${detail?.cropName ?? ''} · ${detail?.conditionName ?? ''}`}
        description={detail ? `Recorded ${formatDateTime(detail.createdAt)}` : undefined}
        size="md"
        footer={
          <>
            {detail && (
              <LinkButton
                to={`/app/explanations?analysis=${detail.id}`}
                size="sm"
                leadingIcon={<Eye size={14} />}
              >
                Open full explanation
              </LinkButton>
            )}
            <Button size="sm" variant="outline" onClick={() => setDetail(null)}>Close</Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-3 text-[13px] leading-relaxed text-muted">
            <div className="grid grid-cols-2 gap-2.5">
              <SummaryTile label="Confidence band" value={detail.status === 'complete' ? `${Math.round(detail.confidence * 100)}%` : 'Incomplete'} />
              <SummaryTile label="Status" value={detail.status === 'complete' ? 'Complete' : 'Incomplete'} />
              <SummaryTile label="Source" value={detail.source === 'sample' ? 'Starter record' : 'You (this device)'} />
              <SummaryTile label="Plotted label" value={detail.label || '—'} />
            </div>
            <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 ring-1 ring-inset ring-line">
              This preview is a summary card. View-level explanations (feature contributions,
              uncertainty notes) open in the full explanation page.
            </p>
          </div>
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this assessment?"
        description="Removes the record and any stored explanation payload from local state."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Keep it</Button>
            <Button variant="danger" onClick={confirmDelete} leadingIcon={<Trash2 size={14} />}>
              Delete record
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-muted">
          {pendingDelete?.cropName} · {pendingDelete?.conditionName} will be removed from this device
          only. Deleted starter rows reappear after <strong className="text-ink">Settings → Reset workspace data</strong>.
        </p>
      </Dialog>
    </>
  )
}

function HistoryRow({
  record,
  onPreview,
  onDelete,
}: {
  record: AnalysisHistoryRecord
  onPreview: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl bg-surface px-4.5 py-4 shadow-card ring-1 ring-inset ring-line transition hover:shadow-lift sm:flex-row sm:items-center',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset',
          record.status !== 'complete'
            ? 'bg-surface-2 text-faint ring-line'
            : record.risk === 'elevated'
              ? 'bg-danger-soft text-danger ring-danger/15'
              : record.risk === 'moderate'
                ? 'bg-caution-soft text-caution ring-caution/15'
                : 'bg-brand-soft text-brand ring-brand/15',
        )}
      >
        <ScanLine size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-bold text-ink">{record.cropName} · {record.conditionName}</p>
          {record.source === 'sample' ? (
            <Badge tone="outline">starter</Badge>
          ) : (
            <Badge tone="brand">you</Badge>
          )}
          <Badge tone={record.risk === 'elevated' ? 'danger' : record.risk === 'moderate' ? 'caution' : 'brand'} dot>
            {record.risk} band
          </Badge>
          {record.status === 'incomplete' && <Badge tone="neutral">incomplete</Badge>}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {record.label} · {formatDateTime(record.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {record.status === 'complete' && (
          <Link
            to={`/app/explanations?analysis=${record.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-[12px] font-bold text-brand ring-1 ring-inset ring-brand/15 transition hover:bg-brand-soft/70"
          >
            Open explanation
            <ArrowRight size={13} aria-hidden />
          </Link>
        )}
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Preview ${record.cropName} ${record.conditionName}`}
          title="Quick preview"
          className="rounded-lg p-2 text-muted ring-1 ring-inset ring-line transition hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Eye size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${record.cropName} ${record.conditionName}`}
          title="Delete record"
          className="rounded-lg p-2 text-muted ring-1 ring-inset ring-line transition hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2/70 px-3 py-2.5 ring-1 ring-inset ring-line">
      <p className="text-[10px] font-bold uppercase tracking-wide text-faint">{label}</p>
      <p className="tabular mt-0.5 truncate text-[13px] font-bold text-ink" title={value}>{value}</p>
    </div>
  )
}

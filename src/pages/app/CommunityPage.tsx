import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BellRing, CalendarRange, CircleAlert, Database, FilePlus2, Info, Map as MapIcon } from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock, EmptyState } from '../../components/ui/shared'
import { Segmented } from '../../components/ui/extra'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/inputs'
import { useToast } from '../../components/ui/toast'
import { TrendAreaChart } from '../../components/charts/TrendAreaChart'
import { CROPS, REGIONS, cropName, regionName, SYMPTOM_FILTERS, symptomLabel as catalogSymptomLabel } from '../../data/catalog'
import { computeAlert, getSeries } from '../../data/community'
import { DATA_QUALITY_NOTE, mergedSeries, submitReport, useCommunityReports } from '../../services/communityService'
import type { AlertLevel, CommunityAlert } from '../../types'
import { formatShortDate, todayISO } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type RangeKey = '4w' | '8w' | '12w'

export function CommunityPage() {
  usePageTitle('Community early warning')
  const { toast } = useToast()
  const [params] = useSearchParams()
  const reports = useCommunityReports()

  const [regionId, setRegionId] = useState(params.get('region') ?? 'north')
  const [cropId, setCropId] = useState(params.get('crop') ?? 'tomato')
  const [symptomId, setSymptomId] = useState(params.get('symptom') ?? 'leaf-brown-spots')
  const [range, setRange] = useState<RangeKey>('12w')
  const [detail, setDetail] = useState<CommunityAlert | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const seriesFull = useMemo(
    () => mergedSeries(regionId, cropId, symptomId),
    [regionId, cropId, symptomId, reports],
  )
  const series = useMemo(() => seriesFull.slice(-rangeCount(range)), [seriesFull, range])
  const alert = useMemo(() => computeAlert(regionId, cropId, symptomId), [regionId, cropId, symptomId])

  const regionAlerts = useMemo(() => {
    return REGIONS.filter((r) => r.id === regionId).flatMap((r) =>
      SYMPTOM_FILTERS.filter((s) => s.id === symptomId).map((s) => computeAlert(r.id, cropId, s.id)),
    )
  }, [regionId, cropId, symptomId])

  const totalInWindow = series.reduce((s, p) => s + p.count, 0)
  const halfA = series.slice(0, Math.floor(series.length / 2)).reduce((s, p) => s + p.count, 0)
  const halfB = series.slice(Math.floor(series.length / 2)).reduce((s, p) => s + p.count, 0)
  const changePct = halfA > 0 ? Math.round(((halfB - halfA) / halfA) * 100) : 0
  const regionReports = reports.filter((r) => r.regionId === regionId && r.cropId === cropId).slice(0, 4)

  return (
    <>
      <PageHeader
        title="Community early-warning centre"
        description="Community observations, aggregated weekly across regions. Rising counts raise cautious flags — never outbreak claims."
        actions={
          <Button leadingIcon={<FilePlus2 size={15} />} onClick={() => setReportOpen(true)}>
            Submit a report
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <SelectWrap label="Region">
            <select aria-label="Region" value={regionId} onChange={(e) => setRegionId(e.target.value)} className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-line">
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </SelectWrap>
          <SelectWrap label="Crop">
            <select aria-label="Crop" value={cropId} onChange={(e) => setCropId(e.target.value)} className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-line">
              {CROPS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </SelectWrap>
          <SelectWrap label="Symptom category">
            <select aria-label="Symptom category" value={symptomId} onChange={(e) => setSymptomId(e.target.value)} className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-line">
              {SYMPTOM_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </SelectWrap>
          <div>
            <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-faint">Window</p>
            <Segmented
              ariaLabel="Date range"
              value={range}
              onChange={setRange}
              options={[
                { id: '4w', label: '4 wk' },
                { id: '8w', label: '8 wk' },
                { id: '12w', label: '12 wk' },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {/* Trend + stats */}
          <Card>
            <CardHeader
              title={`${cropName(cropId)} · ${catalogSymptomLabel(symptomId)}`}
              subtitle={`${regionName(regionId)} — ${range === '4w' ? 'last 4' : range === '8w' ? 'last 8' : 'last 12'} weekly windows`}
              icon={<CalendarRange size={16} />}
            />
            <CardBody>
              <TrendAreaChart data={series} height={250} ariaLabel={`Weekly report counts for ${regionName(regionId)}: ${catalogSymptomLabel(symptomId)} on ${cropName(cropId)}`} />
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <WindowStat label="Reports in window" value={String(totalInWindow)} tone="plain" />
                <WindowStat label="Second-half vs first-half" value={`${changePct >= 0 ? '+' : ''}${changePct}%`} tone={changePct >= 30 ? 'danger' : changePct >= 10 ? 'caution' : 'plain'} />
                <WindowStat label="Current level" value={alert.level === 'attention' ? 'Attention' : alert.level === 'watch' ? 'Watch' : 'Steady'} tone={alert.level === 'attention' ? 'danger' : alert.level === 'watch' ? 'caution' : 'plain'} />
              </div>
              <p className="mt-3 text-center text-[11.5px] text-faint" aria-hidden>
                Hover points for exact counts.
              </p>
            </CardBody>
          </Card>

          {/* Regional strip visualization */}
          <Card>
            <CardHeader title="Regional view" subtitle="Relative report pressure across regions (same crop & symptom)" icon={<MapIcon size={16} />} />
            <CardBody>
              <div className="grid grid-cols-5 gap-2.5">
                {REGIONS.map((r) => {
                  const s = getSeries(r.id, cropId, symptomId)
                  const recent = s.slice(-4).reduce((x, p) => x + p.count, 0)
                  const intensity = Math.min(1, recent / 28)
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegionId(r.id)}
                      className={`group rounded-xl p-2.5 text-center ring-1 transition ${r.id === regionId ? 'ring-brand' : 'ring-line'} hover:ring-brand/50`}
                      aria-pressed={r.id === regionId}
                    >
                      <span
                        aria-hidden
                        className="mx-auto block h-10 w-10 rounded-lg transition-transform group-hover:scale-105"
                        style={{ backgroundColor: r.tone, opacity: 0.35 + intensity * 0.65 }}
                      />
                      <span className="mt-1.5 block text-[10.5px] font-bold leading-tight text-ink">{r.name.replace(' District', '').replace('Central ', '').replace('Highland ', 'High. ')}</span>
                      <span className="tabular block text-[10px] font-semibold text-muted">{recent} recent</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                Opacity shows the recent-4-week count. Regions render as tiles, not a map — no real geography is implied.
              </p>
            </CardBody>
          </Card>

          {/* Data quality */}
          <NoteBlock tone="info" title="Data quality & method" icon={<Database size={15} className="text-faint" />}>
            {DATA_QUALITY_NOTE} Levels use a recent-4-week vs prior-window ratio with absolute floor checks; all
            formulas are visible in the codebase. Reports you submit merge into this week's bars.
          </NoteBlock>
        </div>

        {/* Alerts column */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Watch alerts" subtitle={`For ${regionName(regionId)} · ${cropName(cropId)} · ${catalogSymptomLabel(symptomId)}`} icon={<BellRing size={16} />} />
            <CardBody className="space-y-3">
              {regionAlerts.every((a) => a.level === 'steady') && (
                <EmptyState icon={<BellRing size={17} />} title="No flags for this combo" description="These counts sit inside the 'steady' band — the cautious default." />
              )}
              {regionAlerts.map((a) =>
                a.level === 'steady' ? (
                  <div key={a.id} className="rounded-xl bg-surface-2/60 px-4 py-3 ring-1 ring-inset ring-line">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold text-muted">{catalogSymptomLabel(a.symptomId)}</p>
                      <Badge tone="neutral" dot>steady</Badge>
                    </div>
                    <p className="mt-1 text-[11.5px] text-faint">Counts within normal weekly movement.</p>
                  </div>
                ) : (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
                    <button
                      type="button"
                      onClick={() => setDetail(a)}
                      className="block w-full rounded-xl bg-surface-2/70 px-4 py-3.5 text-left ring-1 ring-inset ring-line transition hover:bg-surface-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-ink">{cropName(a.cropId)} · {catalogSymptomLabel(a.symptomId)}</p>
                        <AlertBadge level={a.level} />
                      </div>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{a.trendSummary}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-brand">
                        Open detail <Info size={11} /> · {a.reportCounts.recent} vs {a.reportCounts.prior} reports
                      </p>
                    </button>
                  </motion.div>
                ),
              )}
              <p className="text-[11px] leading-relaxed text-faint">
                Alerts recompute from the same series that draws the chart — data and flags never disagree.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Your reports" subtitle="Locally submitted observations" />
            <CardBody>
              {regionReports.length === 0 ? (
                <EmptyState icon={<FilePlus2 size={17} />} title="No reports yet" description="Submit a community observation to see the chart react." action={<Button size="sm" variant="secondary" onClick={() => setReportOpen(true)}>Submit a report</Button>} />
              ) : (
                <ul className="space-y-2.5">
                  {regionReports.map((r) => (
                    <li key={r.id} className="rounded-xl bg-surface-2/60 px-3.5 py-3 ring-1 ring-inset ring-line">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-ink">{catalogSymptomLabel(r.symptomId)} · {formatShortDate(r.observedOn)}</p>
                        <Badge tone="brand">{r.sample ? 'starter' : 'yours'}</Badge>
                      </div>
                      {r.notes && <p className="mt-0.5 text-[12px] text-muted">{r.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Alert detail dialog */}
      <Dialog
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.level} flag — ${cropName(detail.cropId)}` : ''}
        description={detail ? `${regionName(detail.regionId)} · ${catalogSymptomLabel(detail.symptomId)}` : undefined}
        size="md"
        footer={<Button variant="outline" onClick={() => setDetail(null)}>Close</Button>}
      >
        {detail && (
          <div className="space-y-4 text-[13.5px] leading-relaxed text-muted">
            <div className="flex flex-wrap gap-2">
              <AlertBadge level={detail.level} />
              <Badge tone="outline">{detail.windowLabel}</Badge>
              <Badge tone="outline">{formatShortDate(Date.now())} computed</Badge>
            </div>
            <p className="text-ink">{detail.trendSummary}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-2/70 px-3.5 py-3 ring-1 ring-inset ring-line">
                <p className="text-[11px] font-bold uppercase tracking-wide text-faint">Recent 4 weeks</p>
                <p className="tabular mt-0.5 text-[20px] font-extrabold text-ink">{detail.reportCounts.recent}</p>
              </div>
              <div className="rounded-xl bg-surface-2/70 px-3.5 py-3 ring-1 ring-inset ring-line">
                <p className="text-[11px] font-bold uppercase tracking-wide text-faint">Prior 8 weeks</p>
                <p className="tabular mt-0.5 text-[20px] font-extrabold text-ink">{detail.reportCounts.prior}</p>
              </div>
            </div>
            <div className="rounded-xl bg-caution-soft/70 px-4 py-3 ring-1 ring-inset ring-caution/25">
              <p className="flex gap-2 text-[12.5px] text-caution dark:text-dawn-deep">
                <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
                {detail.uncertaintyNote}
              </p>
            </div>
            <p className="text-[12px] text-faint">
              Evidence: {detail.reportCounts.recent + detail.reportCounts.prior} report counts (seeded dataset) inform this flag.
              Verification-by-observation remains the sensible next step in the field.
            </p>
          </div>
        )}
      </Dialog>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} defaultRegion={regionId} onToast={toast} />
    </>
  )
}

function SelectWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{label}</p>
      {children}
    </div>
  )
}

function WindowStat({ label, value, tone = 'plain' }: { label: string; value: string; tone?: 'plain' | 'caution' | 'danger' }) {
  const tones = {
    plain: 'text-ink',
    caution: 'text-caution',
    danger: 'text-danger',
  }
  return (
    <div className="rounded-xl bg-surface-2/60 px-3 py-2.5 ring-1 ring-inset ring-line">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-faint">{label}</p>
      <p className={`tabular mt-0.5 text-[17px] font-extrabold ${tones[tone]}`}>{value}</p>
    </div>
  )
}

function AlertBadge({ level }: { level: AlertLevel }) {
  return (
    <Badge tone={level === 'attention' ? 'danger' : level === 'watch' ? 'caution' : 'brand'} dot>
      {level === 'attention' ? 'attention' : level === 'watch' ? 'watch' : 'steady'}
    </Badge>
  )
}

function rangeCount(range: RangeKey): number {
  return range === '4w' ? 4 : range === '8w' ? 8 : 12
}

// ---------------------------------------------------------------------------
// Report submission dialog
// ---------------------------------------------------------------------------

function ReportDialog({
  open,
  onClose,
  defaultRegion,
  onToast,
}: {
  open: boolean
  onClose: () => void
  defaultRegion: string
  onToast: ReturnType<typeof useToast>['toast']
}) {
  const [regionId, setRegionId] = useState(defaultRegion)
  const [cropId, setCropId] = useState('tomato')
  const [symptomId, setSymptomId] = useState('leaf-brown-spots')
  const [observedOn, setObservedOn] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [percentDone, setPercentDone] = useState(0)

  function close() {
    if (!busy) onClose()
  }

  async function handleSubmit() {
    if (notes.trim().length > 300) {
      setNoteError('Keep notes under 300 characters')
      return
    }
    setNoteError(null)
    setBusy(true)
    setPercentDone(55)
    await submitReport({ regionId, cropId, symptomId, observedOn, notes: notes.trim() || undefined })
    setPercentDone(100)
    onToast({ kind: 'success', title: 'Report logged', body: 'Merged into the workspace chart for the selected combo — no real location captured.' })
    setBusy(false)
    setPercentDone(0)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Submit a community report"
      description="Coarse region only — no precise location is collected by design."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy}>{busy ? 'Logging…' : 'Log report'}</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Region" htmlFor="cb-region">
          <Select id="cb-region" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </Field>
        <Field label="Crop" htmlFor="cb-crop">
          <Select id="cb-crop" value={cropId} onChange={(e) => setCropId(e.target.value)}>
            {CROPS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Symptom category" htmlFor="cb-symptom">
          <Select id="cb-symptom" value={symptomId} onChange={(e) => setSymptomId(e.target.value)}>
            {SYMPTOM_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </Field>
        <Field label="Observed on" htmlFor="cb-date">
          <Input id="cb-date" type="date" max={todayISO()} value={observedOn} onChange={(e) => setObservedOn(e.target.value)} />
        </Field>
        <Field label="Notes (optional)" htmlFor="cb-notes" error={noteError ?? undefined} className="sm:col-span-2">
          <Textarea id="cb-notes" placeholder="e.g. scattered lower-leaf patches on two rows" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      {busy && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${percentDone}%` }} />
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted">Merging into workspace…</p>
        </div>
      )}
      <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-[12px] leading-relaxed text-ink ring-1 ring-inset ring-brand/15">
        This input records observable report counts. A rise in such counts may reflect increased
        activity or increased observation effort — it is not a confirmed outbreak.
      </p>
    </Dialog>
  )
}

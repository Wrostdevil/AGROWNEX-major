import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Award, BookOpen, CheckCircle2, CircleAlert, Minus, Plus, ShieldCheck, SlidersHorizontal, TriangleAlert, Wallet } from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock } from '../../components/ui/shared'
import { Segmented } from '../../components/ui/extra'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button, LinkButton } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Slider, Switch } from '../../components/ui/inputs'
import { useToast } from '../../components/ui/toast'
import { planTreatments, conditionsForPlanner, conditionMeta } from '../../services/treatmentService'
import { saveComparison } from '../../services/savedComparisons'
import { useHistory } from '../../services/historyService'
import { EVIDENCE_LABELS } from '../../data/treatments'
import type { TreatmentOption } from '../../types'
import { formatCompactINR } from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type SortMode = 'recommended' | 'cost-asc' | 'effectiveness'

interface Ranked {
  option: TreatmentOption
  score: number
  withinBudget: boolean
  rank: number
  rationale: string
}

const budgetSnapshots = [200, 300, 400, 500, 600, 800, 1000, 1500, 2000]

export function TreatmentsPage() {
  usePageTitle('Treatment planner')
  const { toast } = useToast()
  const [params] = useSearchParams()
  const history = useHistory()

  const conditionOptions = useMemo(() => conditionsForPlanner(null), [])
  const latest = history.find((h) => h.status === 'complete')
  const [conditionId, setConditionId] = useState<string>(() => params.get('condition') ?? latest?.conditionId ?? 'tomato-early-blight')
  const [budget, setBudget] = useState(600)
  const [withinBudgetOnly, setWithinBudgetOnly] = useState(false)
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'has-evidence'>('all')
  const [sortMode, setSortMode] = useState<SortMode>('recommended')
  const [pick, setPick] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [howRankedOpen, setHowRankedOpen] = useState(false)

  // Derive condition from URL param whenever it changes.
  const paramCondition = params.get('condition')
  useEffect(() => {
    if (paramCondition) setConditionId(paramCondition)
  }, [paramCondition])

  const meta = conditionMeta(conditionId)

  const rankedAll = useMemo(() => {
    const { ranked } = planTreatments(conditionId, budget)
    return ranked
  }, [conditionId, budget])

  const visible: Ranked[] = useMemo(() => {
    let list = rankedAll.map((r, i) => ({ ...r, rank: i + 1 }))
    if (withinBudgetOnly) list = list.filter((r) => r.withinBudget)
    if (evidenceFilter === 'has-evidence') list = list.filter((r) => r.option.evidenceStatus !== 'unavailable')
    if (sortMode === 'cost-asc') {
      list.sort((a, b) => (a.option.costMin + a.option.costMax) / 2 - (b.option.costMin + b.option.costMax) / 2)
    } else if (sortMode === 'effectiveness') {
      list.sort((a, b) => b.option.effectiveness - a.option.effectiveness)
    }
    return list
  }, [rankedAll, withinBudgetOnly, evidenceFilter, sortMode])

  const aboveBudgetCount = rankedAll.filter((r) => !r.withinBudget).length
  const pickedRanked = rankedAll.filter((r) => pick.includes(r.option.id))

  function togglePick(id: string) {
    setPick((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= 3 ? [prev[1], prev[2], id] : [...prev, id]))
  }

  function snapshotComparison() {
    if (pick.length === 0) {
      toast({ kind: 'warning', title: 'Pick options first', body: 'Select 2–3 options with the checkboxes to save a comparison snapshot.' })
      return
    }
    saveComparison(`${conditionId} @ ${formatCompactINR(budget)} / acre`)
    toast({ kind: 'success', title: 'Comparison saved', body: 'Stored on this device — the saved-comparison stat updates on the overview.' })
  }

  return (
    <>
      <PageHeader
        title="Cost-aware treatment planner"
        description="Options for the selected pattern, ranked with your set budget. Suitability and safety weigh before affordability — a cheap-but-unsuitable option never rises to the top."
        actions={
          <>
            <Button variant="outline" size="md" leadingIcon={<SlidersHorizontal size={15} />} onClick={() => setHowRankedOpen(true)}>
              How ranking works
            </Button>
          </>
        }
      />

      {latest && !paramCondition && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-brand-soft px-4 py-3 ring-1 ring-inset ring-brand/15">
          <CheckCircle2 size={16} className="shrink-0 text-brand" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-ink">
            Prefilled from your latest assessment: <strong className="font-bold">{latest.cropName} · {latest.conditionName}</strong>
            {' '}— <Link to={`/app/explanations?analysis=${latest.id}`} className="font-bold text-brand hover:underline">review it</Link>, or change the condition below.
          </p>
        </div>
      )}

      {/* Controls */}
      <Card className="mb-6">
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-faint">Condition</p>
            <select
              aria-label="Select condition"
              value={conditionId}
              onChange={(e) => { setConditionId(e.target.value); setPick([]) }}
              className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-line"
            >
              {conditionOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.shortName}</option>
              ))}
            </select>
            {meta && <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{meta.pattern}</p>}
          </div>

          <div className="lg:col-span-2">
            <Slider
              label={
                <span className="flex items-baseline justify-between gap-2">
                  <span>Per-acre budget</span>
                  <span className="tabular rounded-lg bg-brand-soft px-2.5 py-1 text-[13px] font-extrabold text-brand ring-1 ring-inset ring-brand/20">{formatCompactINR(budget)}</span>
                </span>
              }
              min={0}
              max={2000}
              step={50}
              value={budget}
              onChange={(e) => { setBudget(Number(e.target.value)) }}
              hint={budget >= 2000 ? 'Top of the slider — most options fit.' : aboveBudgetCount > 0 ? `${aboveBudgetCount} option${aboveBudgetCount > 1 ? 's' : ''} currently above this budget — flagged, not hidden below.` : 'All options for this condition currently fit.'}
              className="mt-2.5"
            />
            {budgetSnapshots.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {budgetSnapshots.slice(0, 6).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={cn('rounded-lg px-2 py-1 text-[11px] font-bold ring-1 ring-inset transition', budget === b ? 'bg-brand text-on-brand ring-brand' : 'bg-surface-2 text-muted ring-line hover:text-ink')}
                  >
                    ₹{b}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-faint">Filters & sorting</p>
            <div className="flex items-center gap-2.5">
              <Switch checked={withinBudgetOnly} onChange={setWithinBudgetOnly} label="Show only options within budget" />
              <span className="text-[12.5px] font-semibold text-ink">Within budget only</span>
            </div>
            <Segmented
              ariaLabel="Evidence filter"
              value={evidenceFilter}
              onChange={setEvidenceFilter}
              options={[
                { id: 'all', label: 'All evidence' },
                { id: 'has-evidence', label: 'Has evidence' },
              ]}
            />
            <Segmented
              ariaLabel="Sort options"
              value={sortMode}
              onChange={setSortMode}
              options={[
                { id: 'recommended', label: 'Recommended' },
                { id: 'cost-asc', label: 'Cost ↑' },
                { id: 'effectiveness', label: 'Effectiveness' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Compare bar */}
      {pick.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-4 z-30 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest-900 px-4 py-3 text-ivory shadow-lift">
          <p className="text-[12.5px] font-bold">
            {pick.length}/3 selected for comparison
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPick([])} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-sage-300 hover:bg-white/10">Clear</button>
            <Button size="sm" onClick={() => setCompareOpen(true)}>View side-by-side</Button>
          </div>
        </motion.div>
      )}

      {/* Ranked list */}
      <div className="space-y-4" aria-live="polite">
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
            <p className="text-[15px] font-bold text-ink">No options match these filters</p>
            <p className="mt-1 text-[13px] text-muted">Relax the budget filter or widen the evidence filter to see the rest.</p>
          </div>
        )}
        {visible.map((r) => (
          <TreatmentRow key={r.option.id} r={r} picked={pick.includes(r.option.id)} budget={budget} onToggle={() => togglePick(r.option.id)} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={snapshotComparison} leadingIcon={<Wallet size={15} />}>
          Save comparison snapshot
        </Button>
        <LinkButton to="/app/community" variant="ghost" trailingIcon={<ArrowRight size={14} />}>
          Check community trends before spending
        </LinkButton>
      </div>

      <NoteBlock className="mt-6" tone="info" title="What this planner never does">
        It does not list a chemical compound tied to real efficacy rates, does not give dosage or
        spray schedules, and does not claim any option's price or performance — the bands represent
        structure only, and printed labels are the source of truth.
      </NoteBlock>

      {/* Compare dialog */}
      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} title="Option side-by-side" description={`Snapshot — ${pickedRanked.length} options compared on the same axes.`} size="lg" footer={<Button onClick={() => setCompareOpen(false)} variant="outline">Close</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint">
                <th className="py-2 pr-4 font-bold">Option</th>
                <th className="py-2 pr-4 font-bold">Cost band</th>
                <th className="py-2 pr-4 font-bold">Suitability</th>
                <th className="py-2 pr-4 font-bold">Evidence</th>
                <th className="py-2 pr-4 font-bold">Safety notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pickedRanked.map((r) => (
                <tr key={r.option.id} className="align-top">
                  <td className="py-3 pr-4">
                    <p className="font-bold text-ink">{r.option.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{r.option.category}</p>
                  </td>
                  <td className="tabular py-3 pr-4 font-bold text-ink">{formatCompactINR(r.option.costMin)}–{formatCompactINR(r.option.costMax)}</td>
                  <td className="py-3 pr-4">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset', r.withinBudget ? 'bg-brand-soft text-brand ring-brand/20' : 'bg-danger-soft text-danger ring-danger/20')}>
                      {r.withinBudget ? 'within budget' : 'above budget'}
                    </span>
                    <p className="mt-1 text-[11px] text-muted">{Math.round(r.option.effectiveness * 100)}% est. effectiveness</p>
                  </td>
                  <td className="py-3 pr-4 text-[11.5px] text-muted">{EVIDENCE_LABELS[r.option.evidenceStatus]}</td>
                  <td className="py-3 pr-4 text-[11.5px] leading-relaxed text-muted">{r.option.safetyNotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Dialog>

      {/* Ranking explanation */}
      <Dialog
        open={howRankedOpen}
        onClose={() => setHowRankedOpen(false)}
        title="How ranking works"
        description="Deterministic, readable, and biased against unfairness."
        size="md"
        footer={<Button onClick={() => setHowRankedOpen(false)} variant="outline">Close</Button>}
      >
        <div className="space-y-3.5 text-[13.5px] leading-relaxed text-muted">
          <p className="rounded-xl bg-forest-900 px-4 py-3 font-mono text-[12.5px] text-sage-300">
            score = 0.45·suitability + 0.25·safety + 0.20·budget_fit + 0.10·effectiveness
          </p>
          <p><strong className="text-ink">Suitability first.</strong> Each option carries a base suitability for the selected condition family; options listed for a different condition are de-weighted automatically.</p>
          <p><strong className="text-ink">Safety counts.</strong> Options with more usage cautions score slightly lower — never removed, just ordered honestly.</p>
          <p><strong className="text-ink">Graded budget fit.</strong> Fitting your budget scores fully; overshoot decays slowly, so near-budget options stay visible with an "above budget" flag.</p>
          <p><strong className="text-ink">Effectiveness is the smallest term</strong> — it is an estimate only, and the ranking engine reuses exactly this contract as verified data connects.</p>
        </div>
      </Dialog>
    </>
  )
}

function TreatmentRow({ r, picked, budget, onToggle }: { r: Ranked; picked: boolean; budget: number; onToggle: () => void }) {
  const o = r.option
  const cat = { cultural: 'cultural practice', biological: 'biological input', 'chemical-supportive': 'chemical / protective' }[o.category]
  return (
    <motion.div layout transition={{ duration: 0.3, ease }}>
      <Card
        className={cn(
          'overflow-hidden',
          r.rank === 1 && 'ring-brand/35',
        )}
      >
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_170px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn('tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-extrabold', r.rank === 1 ? 'bg-brand text-on-brand' : 'bg-surface-2 text-muted ring-1 ring-inset ring-line')}>
                {r.rank}
              </span>
              <p className="text-[15.5px] font-extrabold text-ink">{o.name}</p>
              {r.rank === 1 && r.withinBudget && (
                <Badge tone="brand" icon={<Award size={11} />}>
                  Top recommendation
                </Badge>
              )}
              {!r.withinBudget && (
                <Badge tone="danger" icon={<TriangleAlert size={11} />}>
                  above budget
                </Badge>
              )}
              {o.evidenceStatus === 'unavailable' && (
                <Badge tone="caution" icon={<CircleAlert size={11} />}>
                  Evidence unavailable
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-semibold text-muted">
              <span>{cat}</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-line">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${o.suitabilityScore * 100}%` }} />
                </span>
                suitability {Math.round(o.suitabilityScore * 100)}%
              </span>
              <span>est. effectiveness {Math.round(o.effectiveness * 100)}%</span>
            </div>

            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{o.suitabilitySummary}</p>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-caution-soft/60 px-3.5 py-2.5 ring-1 ring-inset ring-caution/20">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-caution" aria-hidden />
              <p className="text-[12px] leading-relaxed text-caution dark:text-dawn-deep">{o.safetyNotes}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
              <BookOpen size={13} className="text-faint" aria-hidden />
              <span className="font-semibold">{EVIDENCE_LABELS[o.evidenceStatus]}</span>
              <span className="text-faint">· {o.sourceNote}</span>
            </div>

            <div className="mt-3 rounded-xl bg-danger-soft/50 px-4 py-2.5 ring-1 ring-inset ring-danger/15">
              <p className="text-[12px] leading-relaxed text-danger"><span className="font-bold">Why it sits here: </span>{r.rationale}</p>
            </div>
          </div>

          <div className="flex flex-row items-end justify-between gap-3 sm:flex-col sm:items-stretch">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Cost / acre</p>
              <p className="tabular mt-0.5 text-[19px] font-extrabold leading-none text-ink">{formatCompactINR(o.costMin)}–{formatCompactINR(o.costMax)}</p>
              <p className={cn('mt-1 text-[11px] font-bold', r.withinBudget ? 'text-brand' : 'text-danger')}>
                {r.withinBudget ? 'fits your budget' : `${formatCompactINR(Math.round((o.costMin + o.costMax) / 2 - budget))} over`}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-pressed={picked}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold ring-1 ring-inset transition',
                picked ? 'bg-brand text-on-brand ring-brand' : 'bg-surface text-muted ring-line hover:text-ink',
              )}
            >
              {picked ? <Minus size={13} /> : <Plus size={13} />}
              {picked ? 'In compare' : 'Compare'}
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

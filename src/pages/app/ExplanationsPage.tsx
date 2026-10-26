import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Cpu, Lightbulb, RotateCcw, Stethoscope, TriangleAlert, UserRound } from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock, EmptyState } from '../../components/ui/shared'
import { Tabs } from '../../components/ui/extra'
import { Card } from '../../components/ui/Card'
import { LinkButton } from '../../components/ui/Button'
import { FeatureImportanceChart, ConfidenceRing } from '../../components/charts/FeatureImportanceChart'
import { useHistory } from '../../services/historyService'
import { plainExplanation, technicalRows, limitations } from '../../services/explanationService'
import type { CropAnalysisResult } from '../../types'
import { formatDateTime } from '../../utils'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function ExplanationsPage() {
  usePageTitle('Explainable results')
  const [params, setParams] = useSearchParams()
  const history = useHistory()
  const complete = history.filter((h) => h.status === 'complete')

  const requestedId = params.get('analysis')
  const record = complete.find((h) => h.id === requestedId) ?? undefined
  const fallback = !record ? complete[0] : undefined
  const active = record ?? fallback

  const [view, setView] = useState<'farmer' | 'technical'>('farmer')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const result = active?.result as CropAnalysisResult | undefined
  const features = result?.features ?? []
  const selected = useMemo(
    () => features.find((f) => f.key === selectedKey) ?? features[0],
    [features, selectedKey],
  )

  if (!result || !active) {
    return (
      <>
        <PageHeader title="Explainable results" description="Explanations for completed assessments land here." />
        <EmptyState
          icon={<Lightbulb size={18} />}
          title="No assessments to explain yet"
          description="Run a diagnosis first — each assessment opens here with its drivers, uncertainty note and method metadata."
          action={<LinkButton to="/app/diagnosis">Start a diagnosis</LinkButton>}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Explainable results"
        description="The assessment opens with its drivers. Two readings stay consistent: what it means for the field, and how the result was produced."
      />

      {/* Record selector */}
      {complete.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="list" aria-label="Assessment selector">
          {complete.slice(0, 8).map((h) => (
            <button
              key={h.id}
              role="listitem"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.set('analysis', h.id)
                setParams(next, { replace: true })
                setSelectedKey(null)
              }}
              className={cn(
                'shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-bold ring-1 ring-inset transition',
                h.id === active.id ? 'bg-brand-soft text-brand ring-brand/25' : 'bg-surface text-muted ring-line hover:text-ink',
              )}
            >
              {h.cropName} · {formatDateTime(h.createdAt)}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Main chart card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 pb-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Result summary</p>
                <h2 className="mt-1 text-[19px] font-extrabold tracking-tight text-ink">{result.conditionName}</h2>
                <p className="mt-1 text-[12.5px] text-muted">
                  {active.cropName} · {formatDateTime(result.createdAt)} · {result.matchedSymptoms.length} matching factors
                </p>
              </div>
              <ConfidenceRing value={result.confidence} size={84} label="confidence band" />
            </div>
            <div className="px-5 pb-2">
              <Tabs
                tabs={[
                  { id: 'farmer', label: 'Farmer-friendly', icon: <UserRound size={14} /> },
                  { id: 'technical', label: 'Technical', icon: <Cpu size={14} /> },
                ]}
                activeId={view}
                onChange={(id) => setView(id as 'farmer' | 'technical')}
              />
            </div>
            {view === 'farmer' ? (
              <div className="px-5 pb-5">
                <div className="space-y-2 text-[14px] leading-relaxed text-muted">
                  {plainExplanation(result).map((line, i) => (
                    <p key={i} className={i === 0 ? 'font-semibold text-ink' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5">
                <FeatureImportanceChart features={features} selectedKey={selected?.key} onSelect={setSelectedKey} />
                <dl className="mt-5 divide-y divide-line rounded-xl bg-surface-2/60 ring-1 ring-inset ring-line">
                  {technicalRows(result).map((row) => (
                    <div key={row.label} className="flex flex-col gap-0.5 px-3.5 py-2.5 sm:flex-row sm:gap-6">
                      <dt className="w-56 shrink-0 text-[11.5px] font-bold uppercase tracking-wide text-faint">{row.label}</dt>
                      <dd className="text-[12.5px] leading-relaxed text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Card>

          {/* Selected factor detail */}
          <Card tone="dark">
            <div className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage-400">Selected factor</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[16px] font-extrabold text-ivory">{selected?.label}</p>
                <span
                  className={cn(
                    'tabular rounded-lg px-2.5 py-1 text-[12px] font-extrabold ring-1 ring-inset',
                    selected && selected.direction === 'supports'
                      ? 'bg-[#B84A43]/20 text-[#E7A69F] ring-[#B84A43]/40'
                      : 'bg-[#267A56]/25 text-[#9ED8B7] ring-[#267A56]/50',
                  )}
                >
                  {selected && (selected.contribution > 0 ? '+' : '')}{selected?.contribution.toFixed(2)} · attributed weight
                </span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-sage-300/90">{selected?.detail}</p>
              <p className="mt-2 text-[12px] font-semibold text-sage-400/90">{selected?.values}</p>
              {view === 'farmer' && (
                <div className="mt-4">
                  <FeatureImportanceChart features={features} selectedKey={selected?.key} onSelect={setSelectedKey} className="rounded-xl bg-white/[0.05] p-3 ring-1 ring-inset ring-white/10" />
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Side rail */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08, ease }} className="space-y-6">
          <Card>
            <div className="p-5">
              <p className="flex items-center gap-2 text-[13px] font-bold text-ink"><TriangleAlert size={15} className="text-caution" aria-hidden /> Uncertainty & limitations</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{result.uncertaintyNote}</p>
              <ul className="mt-3 space-y-2">
                {limitations().map((l) => (
                  <li key={l} className="flex gap-2 text-[12px] leading-relaxed text-muted">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-caution" aria-hidden />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="flex items-center gap-2 text-[13px] font-bold text-ink"><BadgeCheck size={15} className="text-brand" aria-hidden /> Evaluation status</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                No accuracy, benchmark or field-performance number is claimed anywhere. Shap-method evaluation on a real
                trained model is part of the planned experiments — see the <LinkButton to="/app/evaluation" variant="ghost" size="sm" className="-mx-2.5">evaluation workspace</LinkButton>.
              </p>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2.5">
            <LinkButton to={`/app/treatments?condition=${result.conditionId}`}>Compare treatments</LinkButton>
            <LinkButton to="/app/diagnosis" variant="outline" leadingIcon={<Stethoscope size={15} />}>
              New assessment
            </LinkButton>
            <LinkButton to="/app/history" variant="ghost" leadingIcon={<RotateCcw size={15} />}>
              History
            </LinkButton>
          </div>

          <NoteBlock tone="brand" title="How to read this page">
            Farmer view speaks in observations ("what pushed this"); technical view shows contribution
            weights and method metadata. Both describe the same assessment — read the uncertainty note
            before acting on it.
          </NoteBlock>
        </motion.div>
      </div>
    </>
  )
}

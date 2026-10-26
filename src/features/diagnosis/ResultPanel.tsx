import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Info, Lightbulb, ScanLine, TriangleAlert, Wallet } from 'lucide-react'
import type { CropAnalysisInput, CropAnalysisResult, RiskBand } from '../../types'
import { ConfidenceRing } from '../../components/charts/FeatureImportanceChart'
import { Badge } from '../../components/ui/Badge'
import { Button, LinkButton } from '../../components/ui/Button'
import { symptomLabel } from '../../data/catalog'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function ResultPanel({
  result,
  onReset,
}: {
  result: CropAnalysisResult
  onReset: () => void
}) {
  const input: CropAnalysisInput = result.input
  // Model id of the local fallback engine in cropAnalysisService — when absent,
  // the result came from the backend ML service.
  const fromLocalEngine = result.modelMeta.name === 'agx-local-rules-v1'
  const riskTone: Record<RiskBand, 'brand' | 'caution' | 'danger'> = { low: 'brand', moderate: 'caution', elevated: 'danger' }
  const topFeatures = result.features.filter((f) => f.direction === 'supports').slice(0, 3)

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      {/* Summary card */}
      <div className="rounded-3xl bg-surface p-6 shadow-card ring-1 ring-inset ring-line">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Assessment</p>
            <h2 className="mt-1 text-[21px] font-extrabold tracking-tight text-ink">{result.conditionName}</h2>
            <p className="mt-1 text-[13px] text-muted">{input.cropName}{input.variety ? ` · ${input.variety}` : ''}</p>
          </div>
          <ConfidenceRing value={result.confidence} label="confidence band" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={riskTone[result.risk]} dot>{result.risk} band</Badge>
          <Badge tone="outline">{result.matchedSymptoms.length} matching factors</Badge>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-faint">Matched observations</p>
          <ul className="space-y-1.5">
            {result.matchedSymptoms.map((m) => (
              <li key={m} className="flex items-center gap-2 text-[13.5px] text-ink">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft text-brand"><ScanLine size={11} aria-hidden /></span>
                {m}
              </li>
            ))}
          </ul>
          {result.unmatchedContext.length > 0 && (
            <p className="mt-2.5 rounded-lg bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
              <strong className="font-semibold text-ink">Noted but not weighted in this pattern:</strong>{' '}
              {result.unmatchedContext.slice(0, 4).join('; ')}.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl bg-danger-soft/60 px-4 py-3 ring-1 ring-inset ring-danger/15">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-danger dark:text-danger">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
            {result.uncertaintyNote}
          </p>
        </div>

        <div className="mt-5 rounded-xl bg-surface-2 px-4 py-3 ring-1 ring-inset ring-line">
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted">
            <Info size={14} className="mt-0.5 shrink-0 text-faint" aria-hidden />
            {fromLocalEngine
              ? 'This result comes from the local analysis engine. Treat it as structured guidance, not a diagnosis.'
              : 'Probability is the model posterior on its training distribution and feature contributions are model associations, not causal effects — not a certified diagnosis.'}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <LinkButton to={`/app/explanations?analysis=${result.id}`} leadingIcon={<Lightbulb size={15} />}>
            View full explanation
          </LinkButton>
          <LinkButton to={`/app/treatments?condition=${result.conditionId}`} variant="outline" leadingIcon={<Wallet size={15} />}>
            Compare treatments
          </LinkButton>
          <Button variant="ghost" onClick={onReset} trailingIcon={<ArrowRight size={15} />}>
            New analysis
          </Button>
        </div>
      </div>

      {/* Why-it-said-that preview */}
      <div className="space-y-6">
        <div className="rounded-3xl bg-forest-900 p-6 text-ivory shadow-card">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sage-400">
            <Lightbulb size={13} aria-hidden /> What leaned the result this way (top {topFeatures.length})
          </p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-sage-300/90">{result.plainSummary}</p>
          <div className="mt-4 space-y-2.5">
            {topFeatures.map((f, i) => (
              <div key={f.key} className="rounded-xl bg-white/[0.06] px-3.5 py-2.5 ring-1 ring-inset ring-white/10">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] font-bold text-ivory">{f.label}</p>
                  <p className="tabular text-[11.5px] font-bold text-dawn-deep">+{f.contribution.toFixed(2)}</p>
                </div>
                <motion.div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" initial={{}} aria-hidden>
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-[#C86A5F] to-[#B84A43]" initial={{ width: 0 }} animate={{ width: `${Math.min(100, f.contribution * 160)}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease }} />
                </motion.div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-sage-300/80">{f.detail}</p>
              </div>
            ))}
          </div>
          <Link to={`/app/explanations?analysis=${result.id}`} className="group mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sage-300">
            Open the explainable-results workspace <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {input.notes && (
          <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">Your notes kept with this result</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink">“{input.notes}”</p>
          </div>
        )}
        {input.imageId && (
          <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">Captured image (context only)</p>
            <img src={input.imageId} alt="Uploaded crop observation" className={cn('mt-2.5 max-h-56 rounded-xl object-cover ring-1 ring-line')} />
            <p className="mt-2 text-[11.5px] text-muted">Image recognition isn't part of this analysis — the photo is stored with the assessment as context.</p>
          </div>
        )}
        <p className="text-center text-[11.5px] text-faint">
          Saved to analysis history — find it under <Link to="/app/history" className="font-bold text-brand">History</Link>.
        </p>
      </div>
    </motion.div>
  )
}

export function symptomMatchNote(ids: string[]): string {
  return ids.map((id) => symptomLabel(id)).join(', ')
}

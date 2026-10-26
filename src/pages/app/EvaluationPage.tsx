import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  FlaskConical,
  Gauge,
  Landmark,
  Microscope,
  Scale,
  Sprout,
  Target,
} from 'lucide-react'
import { usePageTitle } from '../../hooks'
import { PageHeader, NoteBlock, SectionHeading } from '../../components/ui/shared'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LinkButton } from '../../components/ui/Button'
import { Stepper, Segmented } from '../../components/ui/extra'
import { runPatternModel } from '../../data/conditions'
import type { CropAnalysisInput } from '../../types'
import { cn } from '../../utils'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ---------------------------------------------------------------------------
// Fixed sanity-fixture configs pushed through the local scorer, so the page
// shows actual engine behaviour (deterministic, never validation data).
// ---------------------------------------------------------------------------

interface ScenarioDef {
  label: string
  input: CropAnalysisInput
}

const SCENARIOS: ScenarioDef[] = [
  {
    label: 'Tomato · spots + yellowing, humid',
    input: {
      cropId: 'tomato', cropName: 'Tomato',
      symptomIds: ['leaf-brown-spots', 'leaf-yellowing'],
      environment: { humidity: 'high', recentRainfall: 'moderate', temperatureBand: '26-32', growthStage: 'fruiting' },
    },
  },
  {
    label: 'Tomato · powdery coat only',
    input: {
      cropId: 'tomato', cropName: 'Tomato',
      symptomIds: ['leaf-powdery'],
      environment: { humidity: 'low', recentRainfall: 'low', temperatureBand: '26-32' },
    },
  },
  {
    label: 'Maize · long lesions, wet spell',
    input: {
      cropId: 'maize', cropName: 'Maize',
      symptomIds: ['leaf-brown-spots', 'plant-lesion-stem'],
      environment: { humidity: 'high', recentRainfall: 'heavy', temperatureBand: '26-32', growthStage: 'vegetative' },
    },
  },
  {
    label: 'Wheat · rust rows, cool spell',
    input: {
      cropId: 'wheat', cropName: 'Wheat',
      symptomIds: ['leaf-rust', 'leaf-yellowing'],
      environment: { temperatureBand: '15-25', humidity: 'high', growthStage: 'flowering' },
    },
  },
  {
    label: 'Potato · greasy patches, heavy rain',
    input: {
      cropId: 'potato', cropName: 'Potato',
      symptomIds: ['leaf-watersoaked', 'leaf-brown-spots'],
      environment: { humidity: 'high', recentRainfall: 'heavy', temperatureBand: '15-25', drainage: 'poor' },
    },
  },
  {
    label: 'Maize · single vague signal',
    input: {
      cropId: 'maize', cropName: 'Maize',
      symptomIds: ['leaf-tip-burn'],
      environment: { soilMoisture: 'dry', recentRainfall: 'low' },
    },
  },
]

// Planned research protocol — statuses are intentionally preliminary: no phase
// has data or a start date yet, so every phase reads "planned".
const PROTOCOL = [
  {
    label: 'Label set',
    title: 'Curate a lab-confirmed dataset',
    detail: 'Field photos + symptom checklists with lab confirmation where possible; consented collection, farm-label rules signed off by an agronomy reviewer.',
    phase: 'Phase 1 · planned',
  },
  {
    label: 'Offline eval',
    title: 'Run blinded, stratified offline evaluation',
    detail: 'Stratified k-fold by region and crop; never split on the same field between train/test. Accuracy, macro-F1, per-class recall and calibration reported together.',
    phase: 'Phase 2 · planned',
  },
  {
    label: 'XAI audit',
    title: 'Audit explanations with expert review',
    detail: 'Feature-importance outputs checked against agronomy literature; "wrong-but-confident" cases flagged for closure before any release.',
    phase: 'Phase 3 · planned',
  },
  {
    label: 'Field pilot',
    title: 'Scoped farmer pilots (controlled zones)',
    detail: 'Acceptance interviews in controlled pilot zones; opinions stay anonymous and nothing derived from the seeded regions may be published as an outbreak claim.',
    phase: 'Phase 4 · planned',
  },
]

const METRIC_ROWS: { metric: string; planned: string; fixtureNow: 'not measurable' | 'reviewable on fixtures' }[] = [
  { metric: 'Overall accuracy', planned: '≥ 0.85 on the curated test split (target)', fixtureNow: 'not measurable' },
  { metric: 'Macro-F1', planned: '≥ 0.78 averaged across classes, so rare patterns count equally', fixtureNow: 'not measurable' },
  { metric: 'Per-class recall (keep-outs)', planned: 'each class ≥ 0.70; any falling below triggers model review', fixtureNow: 'not measurable' },
  { metric: 'Calibration (ECE)', planned: '≤ 0.08 so "75%" means 75% observed agreement', fixtureNow: 'not measurable' },
  { metric: 'Explanation faithfulness', planned: 'agronomy sign-off on ≥ 90% of sampled explanations', fixtureNow: 'reviewable on fixtures' },
  { metric: 'Farmer acceptance', planned: '≥ 70% "would use again to decide next step" in pilots', fixtureNow: 'not measurable' },
]

const TARGET_CARDS = [
  { icon: Target, label: 'Accuracy (planned)', value: '≥ 85%', sub: 'target on the curated split' },
  { icon: Scale, label: 'Macro-F1 (planned)', value: '≥ 0.78', sub: 'rare classes weighted equally' },
  { icon: Gauge, label: 'Calibration (planned)', value: 'ECE ≤ 0.08', sub: 'confidence must be honest' },
  { icon: Sprout, label: 'Farmer acceptance', value: '≥ 70%', sub: 'pilot survey · planned' },
]

const RESEARCH_QUESTIONS = [
  {
    title: 'RQ1 · Does symptom-plus-environment weighting narrow realistic pattern shortlists?',
    body: 'The study asks whether a small, farmer-observed feature set (symptoms + weather context) can separate the curated pattern families well enough for a usable top-1 read with honest uncertainty.',
  },
  {
    title: 'RQ2 · Do readable explanations improve decisions, not just trust?',
    body: 'Instead of provenance-only analytics, the study tests whether plain-language contribution summaries change a farmer\'s next physical action (re-check a row, isolate a patch) in the intended direction.',
  },
  {
    title: 'RQ3 · Can cost-aware ranking respect a farmer\'s budget without hiding unsafe shortcuts?',
    body: 'Suitability-first ranking is studied under sliding budgets: does constraint-first ordering produce advice that is both affordable and agronomically sound across edge cases?',
  },
  {
    title: 'RQ4 · Does community-report weighting stay honest under noisy self-reporting?',
    body: 'Ratio-and-floors alerting is evaluated for how often it raises a watch without overclaiming; checking the precision of "attention" flags against ground truth is a planned part of the protocol.',
  },
]

export function EvaluationPage() {
  usePageTitle('Research evaluation board')
  const [protocolPhase, setProtocolPhase] = useState(0)

  const scenarioResults = useMemo(
    () =>
      SCENARIOS.map((s) => {
        const out = runPatternModel(s.input)
        return { label: s.label, condition: out.condition, confidence: out.confidence }
      }),
    [],
  )

  const maxConf = Math.max(...scenarioResults.map((r) => r.confidence), 0.5)

  type MetricFilter = 'all' | 'target' | 'fixture'
  const [filter, setFilter] = useState<MetricFilter>('all')
  const visibleMetrics = METRIC_ROWS.filter((m) => {
    if (filter === 'target') return true
    if (filter === 'fixture') return m.fixtureNow === 'reviewable on fixtures'
    return true
  })

  return (
    <>
      <PageHeader
        title="Research evaluation board"
        description="The project lives or dies on honest measurement. This board fixes the evaluation plan up front — and states plainly that no measured results exist yet."
        chip={<Badge tone="caution">In progress</Badge>}
        actions={
          <LinkButton to="/about" variant="outline" trailingIcon={<ArrowRight size={14} />}>
            Meet the project team
          </LinkButton>
        }
      />

      <NoteBlock className="mb-6" tone="caution" title="Methodology & data readiness">
        Every number here is either a <strong>pre-registered-style target</strong> (what the research
        plan aims for) or a <strong>deterministic engine output</strong> (how the local scorer
        currently behaves on the synthetic sanity fixtures). No trained model, no lab-confirmed
        dataset and no pilot study has run as of this build — so there are no measured results to
        report, and nothing on this page is presented as one.
      </NoteBlock>

      {/* Target cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TARGET_CARDS.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05, ease }}>
            <Card className="px-4.5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand ring-1 ring-inset ring-line" aria-hidden>
                  <t.icon size={16} />
                </span>
                <p className="text-[11.5px] font-bold uppercase tracking-wide text-faint">{t.label}</p>
              </div>
              <p className="tabular mt-2 text-[22px] font-extrabold leading-none text-ink">{t.value}</p>
              <p className="mt-1.5 text-[11.5px] text-muted">{t.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Protocol */}
      <div className="mt-10">
        <SectionHeading
          kicker="Planned protocol"
          title="How the system will be judged — before any result exists"
          description="Phases are sequenced so a release can't claim more than its evidence. Each phase defines its own pass bar in advance."
        />
        <Card className="mt-5">
          <div className="px-5 pt-5 pb-2">
            <Stepper steps={['Label set', 'Offline eval', 'XAI audit', 'Field pilot']} current={protocolPhase} />
          </div>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            {PROTOCOL.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setProtocolPhase(i)}
                className={cn(
                  'rounded-xl px-4 py-3.5 text-left ring-1 ring-inset transition',
                  protocolPhase === i ? 'bg-brand-soft ring-brand/30' : 'bg-surface-2/60 ring-line hover:ring-line-strong',
                )}
                aria-pressed={protocolPhase === i}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-extrabold text-ink">{p.phase}</p>
                  {protocolPhase === i && <Badge tone="brand" icon={<CheckCircle2 size={11} />}>Step</Badge>}
                </div>
                <p className={cn('mt-1.5 text-[13.5px] font-bold', protocolPhase === i ? 'text-brand' : 'text-ink')}>{p.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{p.detail}</p>
              </button>
            ))}
          </div>
          <div className="px-5 pb-5">
            <p className="rounded-xl bg-surface-2/70 px-4 py-3 text-[12.5px] leading-relaxed text-muted ring-1 ring-inset ring-line">
              <Compass size={13} className="mr-1.5 inline-block align-[-2px] text-brand" aria-hidden />
              Click a phase to highlight its stage above — the stepper is a study aid, not progress: all
              four phases are <strong className="text-ink">planned</strong>, none started.
            </p>
          </div>
        </Card>
      </div>

      {/* Metric table */}
      <div className="mt-10">
        <SectionHeading
          kicker="Metric definitions"
          title="Each claim gets a metric, each metric gets a number"
          description="Fixed now so results can't drift into marketing language later. Filter to see which metrics the fixture engine can currently produce (none measured versus targets)."
        />
        <Card className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1">
            <Segmented
              ariaLabel="Metric focus"
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'All planned metrics' },
                { id: 'fixture', label: 'Reviewable on fixtures (1)' },
                { id: 'target', label: 'Targets only' },
              ]}
            />
            <Badge tone="outline">definitions fixed pre-data</Badge>
          </div>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[620px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint">
                  <th className="py-2.5 pr-4 font-bold">Metric</th>
                  <th className="py-2.5 pr-4 font-bold">Planned definition & bar</th>
                  <th className="py-2.5 font-bold">Status in this build</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-muted">
                {visibleMetrics.map((m) => (
                  <tr key={m.metric} className="align-top">
                    <td className="py-3 pr-4 font-bold text-ink">{m.metric}</td>
                    <td className="py-3 pr-4 text-[12.5px] leading-relaxed">{m.planned}</td>
                    <td className="py-3">
                      <Badge tone={m.fixtureNow === 'reviewable on fixtures' ? 'caution' : 'neutral'} dot>
                        {m.fixtureNow}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Engine behaviour now */}
      <div className="mt-10">
        <SectionHeading
          kicker="Engine behaviour today"
          title="Sanity fixtures through the current scorer"
          description="Deterministic fixture inputs pushed through the same local scorer the diagnosis page uses — shown to demonstrate engine behaviour, not model quality."
        />
        <Card className="mt-5">
          <CardHeader
            icon={<Microscope size={17} />}
            title="Per-scenario confidence (fixture dataset)"
            subtitle={`Six sanity fixtures run live through the client scorer · full engine-confidence span so far: 0–${Math.round(maxConf * 100)}%`}
          />
          <CardBody className="space-y-2.5">
            {scenarioResults.map((r) => (
              <div key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl bg-surface-2/60 px-3.5 py-2.5 ring-1 ring-inset ring-line sm:grid-cols-[1fr_200px_auto]">
                <p className="min-w-0 truncate text-[12.5px] font-semibold text-ink" title={r.label}>{r.label}</p>
                <p className="max-sm:hidden text-[12px] text-muted">
                  → <span className="font-bold text-ink">{r.condition.shortName}</span> <span className="text-faint">(engine output)</span>
                </p>
                <div className="flex items-center justify-end gap-2.5">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface ring-1 ring-inset ring-line sm:w-28">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(r.confidence / maxConf) * 100}%` }} aria-hidden />
                  </div>
                  <span className="tabular w-9 text-right text-[12.5px] font-bold text-ink">{Math.round(r.confidence * 100)}%</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
        <NoteBlock className="mt-4" tone="info">
          These six fixtures are hand-written sanity cases exercising one pattern each plus a vague
          case that correctly falls back to a low-confidence general-stress profile. They are not
          sampled from any validation split and are not findings.
        </NoteBlock>
      </div>

      {/* Research questions */}
      <div className="mt-10">
        <SectionHeading
          kicker="Research questions"
          title="What the study actually asks"
          description="Four pre-written questions the planned evaluation must answer, kept testable and falsifiable."
        />
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {RESEARCH_QUESTIONS.map((q) => (
            <Card key={q.title} interactive className="px-5 py-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand ring-1 ring-inset ring-brand/20" aria-hidden>
                  <FlaskConical size={15} />
                </span>
                <p className="text-[13.5px] font-extrabold text-ink">{q.title}</p>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">{q.body}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Ethics */}
      <div className="mt-10">
        <SectionHeading
          kicker="Data sourcing & ethics"
          title="Rules the future study must keep"
          description="Collected once, written down before pilots begin, and honoured by every review committee touchpoint."
        />
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              title: 'Lab-confirmed labels only',
              body: 'Training and test data require lab confirmation or agronomist sign-off — no self-labelled images, no scraped data, no unverifiable community photos.',
            },
            {
              icon: Landmark,
              title: 'Consent & anonymity',
              body: 'Pilot farmers consent in writing; interviews anonymised; no personally identifying farm data leaves the device unless explicitly uploaded for the study.',
            },
            {
              icon: Microscope,
              title: 'No outbreak theatre',
              body: 'Community trends use seeded regions and synthetic series — nothing derived from this workspace may be published as a real outbreak claim.',
            },
          ].map((c) => (
            <Card key={c.title} interactive className="px-5 py-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand ring-1 ring-inset ring-brand/20" aria-hidden>
                <c.icon size={16} />
              </span>
              <p className="mt-3 text-[14px] font-bold text-ink">{c.title}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{c.body}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <LinkButton to="/research" variant="outline" trailingIcon={<ArrowRight size={14} />}>
          See the public architecture page
        </LinkButton>
        <LinkButton to="/app/explanations" variant="ghost">
          How engine explanations are rendered
        </LinkButton>
      </div>

      <NoteBlock className="mt-6" tone="brand" title="The board's one rule">
        Nothing gets presented to a farmer, a review panel or a committee as a finding unless its row
        above has a real measured value from the planned protocol — until then, every number stays a
        target or an engine output, and stays labelled as one.
      </NoteBlock>
    </>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, FileText, FlaskConical, Lightbulb, Network, Radar, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react'
import { usePageTitle } from '../hooks'
import { AGENT_CAPABILITIES } from '../data/agentCapabilities'
import { Badge } from '../components/ui/Badge'
import { NoteBlock } from '../components/ui/shared'
import { SceneTerraces } from '../components/layout/scenes'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function ResearchPage() {
  usePageTitle('Research & Trust')
  return (
    <>
      <section className="relative overflow-hidden" aria-label="Research hero">
        <div aria-hidden className="absolute inset-0">
          <SceneTerraces className="h-full w-full object-cover opacity-90" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-canvas/70 via-canvas/40 to-canvas" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 sm:pt-28 lg:px-8">
          <div className="max-w-3xl">
            <p className="kicker text-sage-300">Research & AI transparency</p>
            <h1 className="text-balance mt-3 text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ivory">
              Show the machinery. Publish the limits.
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-sage-300/90">
              AgrowNex researches four technical questions: can an assessment be explained, can
              treatments be ranked within a real budget and evidence constraints, can community
              reports hint at rising activity, and can agent coordination organise it all —
              verifiably. This page is the honest manual for the system.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-16 px-5 py-16 lg:px-8">
        <Section icon={FileText} kicker="Direction" title="Problem statement & motivation">
          <TwoCol>
            <div className="space-y-3.5 text-[14.5px] leading-relaxed text-muted">
              <p>
                <strong className="font-bold text-ink">Problem.</strong> Field-level crop-health decisions in smallholder settings are made quickly, often late and with partial information. Generic prediction apps return an opaque label. That label cannot be interrogated, cannot be reconciled with the farmer's actual budget, and says nothing about what others nearby are seeing.
              </p>
              <p>
                <strong className="font-bold text-ink">Motivation.</strong> Three research threads converge in this project: explainable machine learning (SHAP where suitable), constraint-aware recommendation ranking applied to treatment options and budgets, and early-warning reasoning over weak, noisy community signals. The B.Tech research question is whether these strands can compose into a decision-support system that stays honest about uncertainty at every layer.
              </p>
              <p>
                <strong className="font-bold text-ink">Contribution plan.</strong> A working frontend that (1) exercises the integrated workflow end-to-end with deterministic local data, (2) specifies typed service seams for ML + XAI + retrieval backends, and (3) defines evaluation metrics for each capability before experiments begin.
              </p>
            </div>
            <NoteBlock tone="caution" title="No fabricated results policy" className="self-start">
              Every chart and stated number on this site is either marked “planned” or comes from a recorded run. Numbers from real experiments appear on the <Link className="font-bold text-brand underline decoration-2 underline-offset-2" to="/app/evaluation">evaluation workspace</Link> only when experiments complete; planned work stays marked as planned.
            </NoteBlock>
          </TwoCol>
        </Section>

        <Section icon={Network} kicker="Blueprint" title="System architecture overview">
          <ArchitectureDiagram />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniCard tone="brand" title="Frontend (this build)" body="React + Vite + TypeScript workspace with typed service seams and local persistence." />
            <MiniCard title="Planned serving layer" body="Python FastAPI services: prediction endpoint, XAI endpoint, treatment catalogue, community aggregation, agent orchestration." />
            <MiniCard title="Planned storage" body="MongoDB for workspace data + a trusted agriculture knowledge base for retrieval. Never accessed directly from the browser." />
          </div>
        </Section>

        <Section kicker="Stage" title="ML prediction workflow">
          <StepsGrid
            steps={[
              ['1', 'Inputs collected', 'Structured crop info, symptoms, environment context; optional image for a later image-based model.'],
              ['2', 'Preprocessing', 'Feature vector: one-hot symptoms + normalised environment tokens + crop context. Clean, compact, documented.'],
              ['3', 'Model family (planned)', 'Tree ensembles for tabular symptoms (SHAP-friendly). An image branch stays a separate model with separate explanation handling.'],
              ['4', 'Output', 'Pattern label + probability band + per-feature contributions consumed by the XAI view.'],
            ]}
          />
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            While the ML service is offline, stages 3–4 run on a deterministic local scorer whose outputs
            (weights, bands) keep the same shape — so the interface under test is the real one.
          </p>
        </Section>

        <Section icon={Lightbulb} kicker="Stage" title="Explainable AI methodology">
          <TwoCol>
            <div className="space-y-3.5 text-[14.5px] leading-relaxed text-muted">
              <p>Explanations use <strong className="font-bold text-ink">feature attributions targeted to the model family</strong>: SHAP values for the planned tree ensembles on tabular data. The interface separates two views — a farmer-friendly reading (plain-language statements of what pushed and what did not) and a technical view (signed contributions, model metadata, method note).</p>
              <p>Attributions are presented as <em>evidence for the model's behaviour</em> with explicit limits: they are not proof of causal field processes, and different data types (image models, sequence models) may need different explanation methods entirely.</p>
            </div>
            <NoteBlock tone="brand" title="The SHAP caveat, in one line" className="self-start">
              SHAP describes model behaviour — it does not prove causation. The workspace repeats this wherever attributions appear.
            </NoteBlock>
          </TwoCol>
        </Section>

        <Section icon={Wallet} kicker="Stage" title="Treatment-ranking methodology">
          <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-inset ring-line">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-faint">Deterministic reference score</p>
            <p className="mt-3 rounded-xl bg-forest-900 px-4 py-3.5 font-mono text-[13.5px] leading-relaxed text-sage-300">
              score = 0.45·suitability + 0.25·safety + 0.20·budget_fit + 0.10·effectiveness
            </p>
            <ul className="mt-4 space-y-2 text-[13.5px] leading-relaxed text-muted">
              <li>• <strong className="text-ink">Constraint-first:</strong> suitability and safety are weighted before affordability, so a cheaper but unsuitable option cannot outrank a suitable one.</li>
              <li>• <strong className="text-ink">Graded budget fit:</strong> fit decays gradually up to ~50% over budget — over-budget options stay visible with a flag, never silently hidden.</li>
              <li>• <strong className="text-ink">Evidence discipline:</strong> options carry declared statuses (grade A / limited / unavailable) and unavailable evidence is shown as such.</li>
            </ul>
          </div>
        </Section>

        <Section icon={Radar} kicker="Stage" title="Community monitoring methodology">
          <TwoCol>
            <ul className="space-y-2.5 text-[14.5px] leading-relaxed text-muted">
              <li>• Reports aggregate into weekly counts per region × crop × symptom category.</li>
              <li>• A ratio test compares the most recent 4-week window against the prior 8 weeks, with absolute count floors so tiny noisy combinations never trigger.</li>
              <li>• Levels: <strong className="text-ink">steady</strong>, <strong className="text-ink">watch</strong> (≥ ~1.22× recent/prior ratio), <strong className="text-ink">attention</strong> (≥ ~1.6× with high volume).</li>
              <li>• All thresholds and formulas are visible in code — evaluation of warning quality (lead time vs precision proxy) is planned, not claimed.</li>
            </ul>
            <NoteBlock tone="caution" title="Not an outbreak detector" className="self-start">
              Rising report activity is described as possible increased activity. Verification, confounder checks and lab identification all sit outside this pipeline's honesty budget.
            </NoteBlock>
          </TwoCol>
        </Section>

        <Section kicker="Stage" title="AI-agent orchestration design">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AGENT_CAPABILITIES.map((c) => (
              <div key={c.id} className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-inset ring-line">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-bold text-ink">{c.name}</p>
                  <Badge tone={c.status === 'designed' ? 'caution' : 'brand'}>{c.status === 'designed' ? 'designed' : 'local-traced'}</Badge>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{c.role}</p>
                <p className="mt-2 text-[11px] font-semibold text-faint">{c.tools.join(' · ')}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={FlaskConical} kicker="Validation" title="Planned evaluation metrics (summary)">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Model quality', 'Macro-F1, per-class precision/recall on a held-out set; confusion analysis for symptom-overlap classes'],
              ['Explanation quality', 'Faithfulness + completeness of attributions; qualitative farmer comprehension study (later)'],
              ['Ranking quality', 'Rank agreement with expert ordering; budget-constraint coverage; regret on budget misses'],
              ['Agent behaviour', 'Tool-selection accuracy, task completion rate, latency & cost per query'],
              ['Warning quality', 'Lead time, precision proxy vs confirmation, alert-fatigue rate'],
              ['System quality', 'Response-time budgets per interaction; frontend bundle/perf budgets'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-inset ring-line">
                <p className="text-[13.5px] font-bold text-ink">{t}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{d}</p>
                <p className="mt-2 text-[10.5px] font-bold uppercase tracking-wide text-caution">planned</p>
              </div>
            ))}
          </div>
          <Link to="/app/evaluation" className="group mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-brand">
            Open the full evaluation workspace <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Section>

        <Section icon={ShieldCheck} kicker="Responsibility" title="Limitations & ethical considerations">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Overreliance risk', 'Assessments are decision support, never treatment orders. Copy near every action repeats this framing.'],
              ['Data protection', 'No precise locations are collected. Community reports stay region-level. Workspace data stays local and can be exported or erased from Settings.'],
              ['Digital divide', 'Language readiness beyond English is labelled “planned”. Image-heavy features degrade gracefully to symptom-entry flows.'],
              ['No invented claims', 'No efficacy, dosage, price or outbreak claims are fabricated anywhere — the safest sentence in this project is the one that is not written.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-inset ring-line">
                <p className="text-[14px] font-bold text-ink">{t}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </>
  )
}

function Section({
  children,
  icon: Icon,
  kicker,
  title,
}: {
  children: React.ReactNode
  icon?: LucideIcon
  kicker: string
  title: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease }}
    >
      <div className="mb-5 flex items-center gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Icon size={19} />
          </span>
        )}
        <div>
          <p className="kicker text-faint">{kicker}</p>
          <h2 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">{title}</h2>
        </div>
      </div>
      {children}
    </motion.section>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">{children}</div>
}

function StepsGrid({ steps }: { steps: string[][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map(([n, t, d]) => (
        <div key={n} className="relative rounded-2xl bg-surface p-4 shadow-card ring-1 ring-inset ring-line">
          <span className="hidden rounded-md bg-sage-200 px-2 py-0.5 text-[11px] font-extrabold text-forest-800 lg:block lg:absolute lg:-left-2 lg:top-4">{n}</span>
          <p className="mt-0 text-[14px] font-bold text-ink lg:mt-3">{t}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{d}</p>
        </div>
      ))}
    </div>
  )
}

function MiniCard({ title, body, tone }: { title: string; body: string; tone?: 'brand' }) {
  return (
    <div className={tone === 'brand' ? 'rounded-2xl bg-brand-soft p-4 ring-1 ring-inset ring-brand/20' : 'rounded-2xl bg-surface p-4 shadow-card ring-1 ring-inset ring-line'}>
      <p className="text-[14px] font-bold text-ink">{title}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{body}</p>
    </div>
  )
}

function FlowBox({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <>
      <rect x="0" y="0" width="150" height="44" rx="10" fill={dark ? '#173D32' : '#FFFFFF'} stroke={dark ? 'none' : 'rgba(32,41,35,0.14)'} />
      <text x="75" y="26" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={dark ? '#EAF1E6' : '#202923'}>
        {label}
      </text>
    </>
  )
}

function ArchitectureDiagram() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-forest-900 p-4 sm:p-8" role="img" aria-label="Architecture flow diagram: user inputs feed the analysis service, which produces prediction, attributions, treatment options and trend flags — with an agent orchestration layer above.">
      <svg viewBox="0 0 900 340" className="min-w-[760px]">
        <defs>
          <marker id="ag-arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <path d="M0 0 L9 3.5 L0 7 Z" fill="#8FB98D" />
          </marker>
        </defs>

        {/* inputs */}
        <g transform="translate(20, 28)"><FlowBox label="Crop info & symptoms" /></g>
        <g transform="translate(20, 92)"><FlowBox label="Optional field photo" /></g>
        <g transform="translate(20, 156)"><FlowBox label="Environment context" /></g>
        <g transform="translate(20, 220)"><FlowBox label="Community reports" /></g>

        {/* analysis engine */}
        <g transform="translate(250, 60)">
          <rect x="0" y="0" width="160" height="120" rx="14" fill="#267A56" />
          <text x="80" y="34" textAnchor="middle" fontSize="12" fontWeight="800" fill="#FFFFFF">Analysis service</text>
          <text x="80" y="52" textAnchor="middle" fontSize="9" fill="#CFE7D6">future: FastAPI + model</text>
          <text x="80" y="70" textAnchor="middle" fontSize="9" fill="#CFE7D6">local scorer now —</text>
          <text x="80" y="84" textAnchor="middle" fontSize="9" fill="#CFE7D6">deterministic</text>
          <text x="80" y="104" textAnchor="middle" fontSize="9" fill="#EAD9B4">reference outputs</text>
        </g>

        {/* outputs */}
        <g transform="translate(486, 24)"><FlowBox label="Prediction + band" /></g>
        <g transform="translate(486, 84)"><FlowBox label="Feature attributions" /></g>
        <g transform="translate(486, 144)"><FlowBox label="Treatment options" /></g>
        <g transform="translate(486, 204)"><FlowBox label="Starter-data trend flags" /></g>

        {/* agent layer */}
        <g transform="translate(660, 84)">
          <rect x="0" y="0" width="224" height="140" rx="14" fill="#0E231D" stroke="rgba(255,255,255,0.14)" />
          <text x="112" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill="#EAF1E6">Agent orchestration</text>
          <text x="112" y="46" textAnchor="middle" fontSize="9" fill="#9DBE9A">main orchestrator + capabilities</text>
          <text x="112" y="68" textAnchor="middle" fontSize="9" fill="#9DBE9A">knowledge · analysis · treatment</text>
          <text x="112" y="84" textAnchor="middle" fontSize="9" fill="#9DBE9A">community · safety review</text>
          <text x="112" y="110" textAnchor="middle" fontSize="9" fill="#ECCF9F">designed layer — tracked</text>
          <text x="112" y="126" textAnchor="middle" fontSize="9" fill="#ECCF9F">no fabricated tool calls</text>
        </g>

        {/* UI strip */}
        <g transform="translate(486, 268)">
          <rect x="0" y="0" width="398" height="40" rx="10" fill="#EAF1E6" />
          <text x="199" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#173D32">Workspace: dashboard · diagnosis · XAI · planner · community · history</text>
        </g>

        {/* arrows */}
        <path d="M170 50 L 248 96" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M170 114 L 248 118" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M170 178 L 248 140" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M170 242 L 248 162" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M410 92 L 484 46" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M410 108 L 484 106" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M410 124 L 484 166" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M410 150 C 440 150, 444 226, 484 226" stroke="#8FB98D" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
        <path d="M660 108 L 646 108" stroke="#ECCF9F" strokeWidth="1.6" fill="none" markerEnd="url(#ag-arrow)" />
      </svg>
    </div>
  )
}

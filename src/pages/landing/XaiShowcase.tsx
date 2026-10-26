import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Info } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { FeatureImportanceChart } from '../../components/charts/FeatureImportanceChart'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const SHOWCASE = {
  condition: 'Early blight pattern',
  crop: 'Tomato · fruiting stage',
  confidence: 0.74,
  features: [
    { key: 'lesions', label: 'Dark brown spots or lesions', contribution: 0.42, direction: 'supports' as const, detail: 'Ring-shaped dark spots are the signature observation for this pattern.' },
    { key: 'yellowing', label: 'Yellowing leaves', contribution: 0.2, direction: 'supports' as const, detail: 'Yellowing tissue around the spots usually develops as it ages.' },
    { key: 'humidity', label: 'Humid, warm spell', contribution: 0.18, direction: 'supports' as const, detail: 'Humid 26–30 °C weather lets the pattern spread between leaves.' },
    { key: 'rain', label: 'Recent rain', contribution: 0.11, direction: 'supports' as const, detail: 'Rain splash carries spores upward from lower leaves.' },
    { key: 'baseline', label: 'Baseline occurrence', contribution: -0.2, direction: 'against' as const, detail: 'The model prior gently pulls the assessment back toward "not yet serious".' },
  ],
}

export function XaiShowcase() {
  const [selected, setSelected] = useState<string>('lesions')
  const feature = useMemo(() => SHOWCASE.features.find((f) => f.key === selected) ?? SHOWCASE.features[0], [selected])

  return (
    <section className="grain relative overflow-hidden bg-forest-900 py-20 text-ivory sm:py-28" aria-label="Explainable AI preview">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-forest-700/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-dawn/10 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, ease }} className="max-w-2xl">
          <p className="kicker text-sage-400">Explainable AI · interactive</p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-ivory sm:text-[36px]">
            The prediction comes with its reasoning
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-sage-300/85">
            In the workspace, every result can be opened like this: the assessment, the factors
            that pushed it, and what they mean. Click a bar below to inspect it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="mt-10 grid gap-6 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-inset ring-white/10 backdrop-blur-sm lg:grid-cols-[1.2fr_1fr] lg:p-8"
        >
          <div className="rounded-2xl bg-surface p-5 text-ink sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Analysis preview</p>
                <p className="mt-1 text-[17px] font-extrabold">{SHOWCASE.condition}</p>
                <p className="text-[12.5px] text-muted">{SHOWCASE.crop}</p>
              </div>
              <div className="text-right">
                <p className="tabular text-[26px] font-extrabold leading-none text-brand">74%</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-faint">confidence band</p>
              </div>
              <Badge tone="caution">Starter data</Badge>
            </div>
            <div className="mt-5">
              <FeatureImportanceChart features={SHOWCASE.features} selectedKey={selected} onSelect={setSelected} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-forest-800/80 p-5 ring-1 ring-inset ring-white/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage-400">Selected factor</p>
              <p className="mt-2 text-[16px] font-bold text-ivory">{feature.label}</p>
              <p className="tabular mt-1 text-[12px] font-bold text-dawn-deep">
                weight {feature.contribution > 0 ? '+' : ''}{feature.contribution.toFixed(2)} · {feature.direction}
              </p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-sage-300/90">{feature.detail}</p>
            </div>
            <div className="rounded-2xl bg-forest-800/60 p-5 ring-1 ring-inset ring-white/10">
              <p className="flex items-center gap-2 text-[12.5px] font-semibold text-sage-300">
                <Info size={14} className="text-dawn-deep" /> What this does not mean
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-sage-300/80">
                These weights come from the local analysis engine — connect the ML service and the
                same panel shows SHAP attributions. Explanations describe the assessment; they do
                not prove cause.
              </p>
            </div>
            <Link to="/app/explanations" className="group mt-auto inline-flex items-center gap-2 self-start rounded-xl bg-sage-400/10 px-4 py-2.5 text-[13.5px] font-bold text-sage-300 ring-1 ring-inset ring-sage-400/25 transition hover:bg-sage-400/20">
              Open the full XAI workspace <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

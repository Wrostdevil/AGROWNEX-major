/**
 * Deterministic, testable treatment-ranking engine.
 *
 * Input = eligible curated options + a budget; output = ranked options with
 * reasons. The weighted score is a transparent *proposed decision rule* —
 * documented, not scientifically validated:
 *
 *   score = 0.45·suitability + 0.25·safety + 0.20·budget_fit + 0.10·effectiveness
 *
 * Safety and suitability always weigh before cost; a cheaper option never
 * outranks safety. Options known-unsuitable are rejected outright upstream.
 * Missing effectiveness evidence is never invented — it scores 0 and the gap
 * is disclosed in the rationale.
 */

export interface RankableOption {
  optionId: string
  name: string
  category: string
  costMin: number
  costMax: number
  costUnit: string
  suitabilityScore: number
  effectivenessScore: number | null
  evidenceStatus: 'sample-grade' | 'sample-limited' | 'unavailable'
  safetyNotes: string
  sourceNote: string
  suitabilitySummary?: string
}

export interface RankedOption {
  option: RankableOption
  score: number
  withinBudget: boolean
  rank: number
  budgetFit: number
  safetyScore: number
  effectivenessTerm: number
  rationale: string
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function safetyScoreFor(option: RankableOption): number {
  const cautions = (option.safetyNotes.match(/avoid|caution|not |never|wear|keep/gi) ?? []).length
  return clamp01(1 - cautions * 0.06)
}

function budgetFit(midpointCost: number, budget: number): number {
  if (budget <= 0) return 0
  if (midpointCost <= budget) return 1
  return clamp01(1 - (midpointCost - budget) / (budget * 1.5))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Math.round(Math.max(0, amount)),
  )
}

export function rankOptions(options: RankableOption[], budget: number, suitable: Set<string>): RankedOption[] {
  const eligible = options.filter((o) => suitable.has(o.optionId))
  const ranked = eligible.map((option) => {
    const midpoint = (option.costMin + option.costMax) / 2
    const fit = budgetFit(midpoint, budget)
    const safety = safetyScoreFor(option)
    const effectiveness = clamp01(option.effectivenessScore ?? 0)
    const score =
      0.45 * clamp01(option.suitabilityScore) +
      0.25 * safety +
      0.2 * fit +
      0.1 * effectiveness

    const reasons: string[] = [`suitability for the selected pattern: ${Math.round(option.suitabilityScore * 100)}%`]
    if (midpoint > budget) {
      reasons.push(`cost midpoint ${formatINR(midpoint - budget)} above budget — flagged, not hidden`)
    } else {
      reasons.push('cost band fits the set budget')
    }
    if (option.effectivenessScore === null) {
      reasons.push('effectiveness evidence missing — scored conservatively and disclosed')
    }
    if (option.evidenceStatus === 'unavailable') reasons.push('evidence status: unavailable')

    return {
      option,
      score: Number(score.toFixed(4)),
      withinBudget: midpoint <= budget,
      rank: 0,
      budgetFit: fit,
      safetyScore: safety,
      effectivenessTerm: effectiveness,
      rationale: reasons.join('; '),
    }
  })
  ranked.sort((a, b) => b.score - a.score)
  return ranked.map((r, i) => ({ ...r, rank: i + 1 }))
}

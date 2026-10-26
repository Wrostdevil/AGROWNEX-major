import { describe, expect, it } from 'vitest'
import { rankOptions, type RankableOption } from '../services/ranking.js'
import { computeLevel, coreTrend, splitWindows, aggregateBySeries, DEFAULT_THRESHOLDS } from '../services/communityTrends.js'

// ---------------------------------------------------------------------------
// Ranking engine — the documented rule
// ---------------------------------------------------------------------------

function option(overrides: Partial<RankableOption> = {}): RankableOption {
  return {
    optionId: 'opt-a',
    name: 'Option A (sample)',
    category: 'cultural',
    costMin: 100,
    costMax: 200,
    costUnit: 'INR/acre',
    suitabilityScore: 0.8,
    effectivenessScore: 0.6,
    evidenceStatus: 'sample-limited',
    safetyNotes: 'wear gloves',
    sourceNote: 'demo',
    ...overrides,
  }
}

describe('rankOptions', () => {
  it('ranks all suitable options deterministically and in descending score', () => {
    const options = [option({ optionId: 'a', suitabilityScore: 0.6 }), option({ optionId: 'b', suitabilityScore: 0.9 })]
    const ranked = rankOptions(options, 500, new Set(['a', 'b']))
    expect(ranked).toHaveLength(2)
    expect(ranked[0].option.optionId).toBe('b')
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].withinBudget).toBe(true)
  })

  it('never lets a cheaper unsafe option outrank suitability + safety ordering', () => {
    const cheapButLessSuitable = option({ optionId: 'cheap', costMin: 0, costMax: 100, suitabilityScore: 0.5, effectivenessScore: null })
    const fittingBetter = option({ optionId: 'better', costMin: 400, costMax: 450, suitabilityScore: 0.85, effectivenessScore: 0.6 })
    const ranked = rankOptions([cheapButLessSuitable, fittingBetter], 500, new Set(['cheap', 'better']))
    expect(ranked[0].option.optionId).toBe('better')
  })

  it('flags above-budget options instead of hiding them', () => {
    const expensive = option({ optionId: 'expensive', costMin: 900, costMax: 1000 })
    const ranked = rankOptions([expensive], 500, new Set(['expensive']))
    expect(ranked[0].withinBudget).toBe(false)
    expect(ranked[0].rationale).toContain('above budget')
  })

  it('rejects options missing from the suitable set outright', () => {
    const ranked = rankOptions([option({ optionId: 'x' })], 500, new Set<string>())
    expect(ranked).toHaveLength(0)
  })

  it('discloses missing effectiveness evidence instead of inventing it', () => {
    const noEvidence = option({ optionId: 'z', effectivenessScore: null })
    const ranked = rankOptions([noEvidence], 500, new Set(['z']))
    expect(ranked[0].effectivenessTerm).toBe(0)
    expect(ranked[0].rationale).toContain('effectiveness evidence missing')
  })
})

// ---------------------------------------------------------------------------
// Community trend rule
// ---------------------------------------------------------------------------

describe('community trend levels', () => {
  it('is steady without reports', () => {
    expect(computeLevel(0, 0, DEFAULT_THRESHOLDS)).toEqual({ level: 'steady', ratio: null })
  })

  it('never reaches attention without both ratio and floor', () => {
    // 4 vs 3 reports is 1.33x but recent volume is below the watch floor of 5
    expect(computeLevel(4, 3, DEFAULT_THRESHOLDS).level).toBe('steady')
    expect(computeLevel(3, 1, DEFAULT_THRESHOLDS).level).toBe('steady')
    // watch needs >= 5 recent with >= 1.22x
    expect(computeLevel(5, 4, DEFAULT_THRESHOLDS).level).toBe('watch')
  })

  it('marks attention on strong elevation above the floor', () => {
    const level = computeLevel(16, 8, DEFAULT_THRESHOLDS)
    expect(level.level).toBe('attention')
    expect(level.ratio).toBeCloseTo(2.0)
  })

  it('keeps small populations at watch even when ratio is high', () => {
    expect(computeLevel(6, 1, DEFAULT_THRESHOLDS).level).toBe('watch')
  })

  it('uses cautious wording not outbreak language', () => {
    const trend = coreTrend(16, 8, DEFAULT_THRESHOLDS, 'w')
    expect(trend.trendSummary).toMatch(/Potential increase in reported symptoms/)
    expect(trend.trendSummary).not.toMatch(/outbreak confirmed/i)
    expect(trend.uncertaintyNote).toMatch(/not a confirmed outbreak/)
  })
})

describe('windowing + aggregation', () => {
  const now = Date.parse('2026-10-20T00:00:00Z')

  it('splits dates into recent vs prior windows', () => {
    // now = 2026-10-20 → recent window starts 2026-10-06, prior = 2026-09-22..10-06
    const { recent, prior } = splitWindows(
      ['2026-10-19', '2026-10-08', '2026-09-30', '2026-09-25'],
      14,
      now,
    )
    expect(recent).toBe(2)
    expect(prior).toBe(2)
  })

  it('aggregates reports per region+crop+symptom series', () => {
    const series = aggregateBySeries([
      { regionId: 'river', cropId: 'tomato', symptomId: 'leaf-brown-spots', observedOn: '2026-10-19' },
      { regionId: 'river', cropId: 'tomato', symptomId: 'leaf-brown-spots', observedOn: '2026-10-02' },
      { regionId: 'valley', cropId: 'maize', symptomId: 'leaf-yellowing', observedOn: '2026-10-01' },
    ])
    expect(series).toHaveLength(2)
    const river = series.find((s) => s.regionId === 'river')
    expect(river?.dates).toHaveLength(2)
  })
})

import type { CropAnalysisResult } from '../types'

/**
 * explanationService — surfaces the explainability layer for an analysis result.
 *
 * In production this will call the FastAPI XAI endpoint (SHAP values for
 * the deployed model family). Here it reshapes the deterministic local scorer's
 * contributions with farmer- and technical-facing copy.
 */

export function plainExplanation(result: CropAnalysisResult): string[] {
  const top = [...result.features]
    .filter((f) => f.direction === 'supports')
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)

  const lead = `${result.conditionName} received a confidence band of ${Math.round(result.confidence * 100)}%. The three observations with the largest effect were:`
  const items = top.map((f) => `• ${f.label} — ${f.detail}`)
  const caveat =
    'These are engine-generated importance weights. They describe which observations moved this particular assessment, not proven cause-effect relationships.'

  return [lead, ...items, caveat]
}

export function technicalRows(result: CropAnalysisResult): { label: string; value: string }[] {
  return [
    { label: 'Scoring engine', value: result.modelMeta.name },
    { label: 'Model family traced', value: result.modelMeta.family },
    { label: 'Explanation method', value: result.modelMeta.method },
    {
      label: 'Input features used',
      value: `${result.modelMeta.inputFeatures.length} (symptoms + environment noted)`,
    },
    {
      label: 'Contribution sum',
      value: result.features.reduce((s, f) => s + f.contribution, 0).toFixed(2),
    },
  ]
}

export function limitations(): string[] {
  return [
    'Explanations describe deterministic engine behaviour — they do not prove causal relationships in your field.',
    'Symptoms of different diseases can overlap; a close-up photo would improve any future assessment.',
    'Importance values are engine weights, not SHAP outputs from a trained model.',
    'The engine cannot see: field history, spread within the plot, or lab identity of any pathogen.',
  ]
}

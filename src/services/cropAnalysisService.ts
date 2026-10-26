import type { CropAnalysisInput, CropAnalysisResult, ExplanationFeature } from '../types'
import { ALL_SYMPTOMS, cropName, symptomLabel } from '../data/catalog'
import { runPatternModel } from '../data/conditions'
import { addHistory, removeHistory, getHistoryRecord } from './historyService'
import { pushNotification } from './notificationService'
import { delay } from './storage'
import { createDiagnosis } from './api/endpoints'
import { isApiError } from './api/apiClient'
import { uid } from '../utils'

/**
 * cropAnalysisService — local frontend implementation.
 *
 * Runs a deterministic scoring pass over the submitted crop information. It is
 * designed to be replaced by a POST to the FastAPI ML service later; callers
 * only depend on the returned CropAnalysisResult shape.
 */

export const ANALYSIS_STAGES = [
  { id: 'review', label: 'Reviewing the submitted information', detail: 'Crop, symptoms and optional environment notes' },
  { id: 'compare', label: 'Comparing disease-pattern profiles', detail: 'Pattern catalogue — no live model inference' },
  { id: 'score', label: 'Scoring matching factors', detail: 'Deterministic weighting' },
  { id: 'prepare', label: 'Preparing the result', detail: 'Explanation data laid out for review' },
] as const

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG or WebP images are supported.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Images should be under 5 MB — larger files are downsized before storing.'
  }
  return null
}

export interface AnalysisOutcome {
  result: CropAnalysisResult
  /** provenance so the UI can say exactly which engine produced the result */
  pipeline: 'ml-service' | 'local'
}

export async function analyzeCrop(input: CropAnalysisInput): Promise<AnalysisOutcome> {
  // 1) Try the real backend (Express → FastAPI → trained model + SHAP).
  try {
    const api = await createDiagnosis({
      cropId: input.cropId,
      symptomIds: input.symptomIds,
      environment: (input.environment ?? {}) as Record<string, string | undefined>,
      notes: input.notes,
    })
    const a = api.analysis
    const features: ExplanationFeature[] = a.features.map((f) => ({
      key: f.key,
      label: f.label,
      contribution: f.contribution,
      direction: f.direction,
      values: f.value,
      detail:
        f.direction === 'supports'
          ? 'This factor pushed the model toward the predicted pattern (SHAP contribution).'
          : 'This factor pushed the model away from the predicted pattern (SHAP contribution).',
    }))
    const result: CropAnalysisResult = {
      id: uid('an'),
      createdAt: Date.now(),
      input,
      conditionId: a.conditionId,
      conditionName: a.conditionName,
      confidence: api.probabilityTop,
      risk: api.riskBand,
      matchedSymptoms: input.symptomIds.map((id) => symptomLabel(id)),
      unmatchedContext: [],
      features,
      plainSummary: `The backend model assessed this submission as ${a.conditionName}. Probability ${Math.round(api.probabilityTop * 100)}% is the model posterior on the training distribution — not a certified diagnosis and not calibrated confidence.`,
      technicalSummary: `Model: ${a.modelMeta.name} v${a.modelMeta.version} (${a.modelMeta.task}). SHAP TreeExplainer features and the full posterior are shown below. ${api.notice}`,
      uncertaintyNote: a.uncertaintyNote,
      modelMeta: {
        name: a.modelMeta.name,
        family: 'Real trained artefact served by the FastAPI ML service',
        method: 'scikit-learn pipeline + SHAP TreeExplainer over the trained model output',
        inputFeatures: [
          ...input.symptomIds.map((id) => `symptom:${symptomLabel(id)}`),
          ...Object.entries(input.environment ?? {}).map(([k, v]) => `${k}: ${String(v)}`),
        ],
        note: 'Produced by the actual trained model. Feature contributions are model associations, not causal effects.',
      },
    }
    persistAnalysis(result)
    pushNotification({
      kind: 'analysis-complete',
      title: 'Model assessment ready',
      body: `${result.conditionName} • posterior ${Math.round(result.confidence * 100)}% (model, not calibrated confidence).`,
      link: { label: 'View explanations', to: `/app/explanations?analysis=${result.id}` },
    })
    return { result, pipeline: 'ml-service' }
  } catch (err) {
    console.warn(
      '[diagnosis] ML pipeline unavailable — running the local engine instead:',
      isApiError(err) ? `${err.status} ${err.code}: ${err.message}` : err,
    )
  }

  // 2) Explicit, visible fallback: the labelled local engine.
  const output = runPatternModel(input)
  const result: CropAnalysisResult = {
    id: uid('an'),
    createdAt: Date.now(),
    input,
    conditionId: output.condition.id,
    conditionName: output.condition.name,
    confidence: output.confidence,
    risk: riskFor(input.symptomIds.length, output.confidence),
    matchedSymptoms: output.matches.map((m) => m.label),
    unmatchedContext: output.unmatched,
    features: output.features,
    plainSummary: output.condition.plainSummary,
    technicalSummary: output.condition.technicalSummary,
    uncertaintyNote: output.condition.uncertaintyNote,
    modelMeta: {
      name: 'agx-local-rules-v1',
      family: 'Deterministic local scorer (traces a random-forest-shaped interface)',
      method: 'Symptom and environment weighting — SHAP values will appear here once a trained model is connected',
      inputFeatures: [
        ...input.symptomIds.map((id) => `symptom:${symptomLabel(id)}`),
        ...Object.entries(input.environment ?? {}).map(([k, v]) => `${k}: ${String(v)}`),
      ],
      note: 'Local engine — deterministic weighting performs no machine-learned inference.',
    },
  }
  persistAnalysis(result)
  pushNotification({
    kind: 'analysis-complete',
    title: 'Assessment ready',
    body: `${result.conditionName} • ${Math.round(result.confidence * 100)}% confidence from the local engine.`,
    link: { label: 'View explanations', to: `/app/explanations?analysis=${result.id}` },
  })
  return delay({ result, pipeline: 'local' as const }, 2400)
}

function persistAnalysis(result: CropAnalysisResult): void {
  addHistory({
    id: result.id,
    createdAt: result.createdAt,
    cropId: result.input.cropId,
    cropName: result.input.cropName || cropName(result.input.cropId),
    label: result.input.notes?.slice(0, 40) || `${result.conditionName}`,
    conditionId: result.conditionId,
    conditionName: result.conditionName,
    confidence: result.confidence,
    risk: result.risk,
    status: 'complete',
    source: 'user',
    thumbnail: result.input.imageId ?? undefined,
    result,
  })
}

function riskFor(symptomCount: number, confidence: number): CropAnalysisResult['risk'] {
  if (symptomCount >= 3 || confidence >= 0.8) return 'elevated'
  if (symptomCount >= 2 || confidence >= 0.6) return 'moderate'
  return 'low'
}

export function symptomOptions() {
  return ALL_SYMPTOMS
}

export function deleteAnalysis(id: string) {
  removeHistory(id)
}

export { getHistoryRecord }

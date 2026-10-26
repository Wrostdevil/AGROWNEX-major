import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

/**
 * Client for the FastAPI ML service. All calls time out and normalise errors;
 * readiness is probed so the API can report model availability truthfully.
 */

export interface MlPrediction {
  conditionId: string
  conditionName: string
  probabilities: Array<{ conditionId: string; name: string; probability: number }>
  confidence: number
  modelInfo: { name: string; version: string; task: string; trained: boolean; limitations: string[] }
  warnings: string[]
  requestId?: string
}

export interface MlFeature {
  feature: string
  label: string
  value: string
  contribution: number
  direction: 'supports' | 'against'
}

export interface MlStatus {
  reachable: boolean
  trained: boolean
  model: string | null
  instructions?: string
  detail?: string
}

function httpTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

async function getJson<T>(url: string, timeout = env.ML_TIMEOUT_MS): Promise<T> {
  const res = await httpTimeout(url, { method: 'GET' }, timeout)
  if (!res.ok) throw new Error(`ML service ${res.status} ${res.statusText} for ${url}`)
  return (await res.json()) as T
}

export async function mlStatus(): Promise<MlStatus> {
  try {
    const info = await getJson<{ service: string; model: { trained: boolean; name: string | null; instructions?: string }; version: string }>(
      `${env.ML_SERVICE_URL}/model/info`,
      4000,
    )
    return {
      reachable: true,
      trained: info.model.trained,
      model: info.model.name,
      instructions: info.model.instructions,
    }
  } catch (err) {
    return {
      reachable: false,
      trained: false,
      model: null,
      detail: err instanceof Error ? err.message : String(err),
      instructions: 'Start the ML service: cd ml-service && .venv\\Scripts\\Activate.ps1 && uvicorn app.main:app --port 8000',
    }
  }
}

export interface PredictInput {
  cropId: string
  symptomIds: string[]
  environment?: Record<string, string | undefined>
  notes?: string
}

export interface PredictAndExplainResponse {
  conditionId: string
  conditionName: string
  probabilities: Array<{ conditionId: string; name: string; probability: number }>
  confidence: number
  method: string
  baseline: number
  features: MlFeature[]
  caveats: string[]
  modelInfo: { name: string; version: string; task: string; trained: boolean; limitations: string[] }
  warnings: string[]
  requestId?: string
}

/** POST /predict-and-explain — throws with clear instructions when the model is not ready. */
export async function predictAndExplain(input: PredictInput): Promise<PredictAndExplainResponse> {
  const body = {
    crop_id: input.cropId,
    symptom_ids: input.symptomIds,
    environment: input.environment ?? {},
  }
  const res = await httpTimeout(
    `${env.ML_SERVICE_URL}/predict-and-explain`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    env.ML_TIMEOUT_MS,
  )
  if (res.status === 503) {
    const payload = (await res.json().catch(() => null)) as { detail?: { code?: string; message?: string; instructions?: string } } | null
    const message = payload?.detail?.message ?? 'ML model artifacts are not prepared.'
    const instructions =
      payload?.detail?.instructions ?? 'cd ml-service && python -m training.make_fixture && python -m training.train'
    logger.warn('ML service reports no trained artifacts', { status: 503 })
    const err = new Error(message) as Error & { code?: string; instructions?: string; ml_unavailable?: boolean }
    err.code = 'MODEL_UNAVAILABLE'
    err.instructions = instructions
    throw err
  }
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: { message?: string }; detail?: string } | null
    throw new Error(payload?.error?.message ?? payload?.detail ?? `ML service error ${res.status}`)
  }
  return (await res.json()) as PredictAndExplainResponse
}

/** Status shaped for the research metrics endpoint (section 16). */
export async function modelStatusForResearch(): Promise<{
  reachable: boolean
  trained: boolean
  model: string | null
  taskTitle: string
  instructions?: string
}> {
  const status = await mlStatus()
  return {
    reachable: status.reachable,
    trained: status.trained,
    model: status.model,
    taskTitle: status.trained
      ? 'Tabular disease-risk assessment - trained on the documented fixture dataset (see ml-service README for scope and limits)'
      : 'Tabular disease-risk assessment - artifacts not trained yet',
    instructions: status.instructions,
  }
}

import { Router } from 'express'
import { diagnosisCreateSchema } from '../validators/schemas.js'
import { CropAnalysis, AuditEvent } from '../models/index.js'
import { requireDb } from '../config/db.js'
import { ApiError, ApiError503, ApiErrorNotFound } from '../middleware/errors.js'
import { ah } from '../middleware/async.js'
import { predictAndExplain } from '../services/mlClient.js'
import { conditionNameOf } from './catalog-shared.js'

export const diagnosesRouter = Router()

/**
 * Crop analyses. POST performs REAL inference through the FastAPI ML service
 * and persists the verified result. When the model is unavailable the route
 * fails with 503 MODEL_UNAVAILABLE plus exact preparation instructions — the
 * server never invents a diagnosis; the frontend can then choose its clearly
 * labelled demo engine explicitly.
 */

diagnosesRouter.get('/', ah(async (req, res) => {
  requireDb()
  const limit = Number(req.query.limit ?? 30)
  const skip = Number(req.query.skip ?? 0)
  const filter: Record<string, unknown> = {}
  if (typeof req.query.cropId === 'string' && req.query.cropId) filter.cropId = req.query.cropId
  if (typeof req.query.conditionId === 'string' && req.query.conditionId) filter.conditionId = req.query.conditionId
  const [items, total] = await Promise.all([
    CropAnalysis.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
    CropAnalysis.countDocuments(filter),
  ])
  res.json({
    items: items.map((d) => ({ ...d, id: String(d._id) })),
    total,
    notice: 'Stored model outputs from this instance; probabilities are model posteriors, not calibrated confidence.',
  })
}))

diagnosesRouter.get('/:id', ah(async (req, res) => {
  requireDb()
  const doc = await CropAnalysis.findById(req.params.id).lean()
  if (!doc) throw new ApiErrorNotFound(`No analysis with id ${req.params.id}`)
  res.json({ ...doc, id: String(doc._id) })
}))

diagnosesRouter.post('/', ah(async (req, res) => {
  requireDb()
  const input = diagnosisCreateSchema.parse(req.body ?? {})
  const conditionLabel = prettyLabel(input.label, input.cropId)

  let prediction
  try {
    prediction = await predictAndExplain({
      cropId: input.cropId,
      symptomIds: input.symptomIds,
      environment: sanitizedEnvironment(input.environment),
      notes: input.notes,
    })
  } catch (err) {
    if (err instanceof ApiError) throw err
    const asRecord = err as { code?: string; instructions?: string; message?: string }
    if (asRecord.code === 'MODEL_UNAVAILABLE') {
      throw new ApiError503(
        `Model artifacts are missing, so no diagnosis was produced this time. ${asRecord.message ?? ''}`.trim(),
        'MODEL_UNAVAILABLE',
      )
    }
    throw new ApiError(502, 'ML_SERVICE_ERROR', `The ML service could not complete the request: ${asRecord.message ?? 'unknown error'}`)
  }

  const riskBand = riskFromProbability(prediction.confidence)
  const matched = intersectSymptoms(input.symptomIds)
  const doc = await CropAnalysis.create({
    ...input,
    cropName: input.cropId,
    label: conditionLabel,
    conditionId: prediction.conditionId,
    conditionName: prediction.conditionName,
    probabilityTop: prediction.confidence,
    riskBand,
    probabilities: prediction.probabilities,
    matchedSymptoms: matched,
    features: prediction.features.map((f) => ({
      key: f.feature,
      label: f.label,
      value: f.value,
      contribution: f.contribution,
      direction: f.direction,
    })),
    uncertaintyNote: uncertaintyLine(prediction.modelInfo.limitations, prediction.warnings),
    modelMeta: prediction.modelInfo,
    mlRequestId: prediction.requestId,
    pipeline: 'ml-service',
  })
  await AuditEvent.create({ event: 'crop-analysis:created', detail: { analysisId: String(doc._id), conditionId: prediction.conditionId } })
  res.status(201).json({
    id: String(doc._id),
    createdAt: doc.createdAt,
    ...input,
    analysis: {
      conditionId: prediction.conditionId,
      conditionName: prediction.conditionName,
      probabilityTop: prediction.confidence,
      riskBand,
      probabilities: prediction.probabilities,
      matchedSymptoms: matched,
      features: [...doc.features],
      uncertaintyNote: uncertaintyLine(prediction.modelInfo.limitations, prediction.warnings),
      modelMeta: prediction.modelInfo,
      warnings: prediction.warnings,
    },
    notice: 'Model posterior — not a certified diagnosis. Verify locally with agricultural advisory sources.',
  })
}))

diagnosesRouter.delete('/:id', ah(async (req, res) => {
  requireDb()
  const doc = await CropAnalysis.findByIdAndDelete(req.params.id)
  if (!doc) throw new ApiErrorNotFound(`No analysis with id ${req.params.id}`)
  res.json({ deleted: String(doc._id) })
}))

function prettyLabel(label: string | undefined, cropId: string): string {
  if (label && label.trim()) return label.trim()
  return `Analysis for ${conditionNameOf(cropId)} (sample run)`
}

const ENV_KEYS = ['humidity', 'recentRainfall', 'temperatureBand', 'soilMoisture', 'drainage', 'growthStage'] as const

function sanitizedEnvironment(env: Record<string, string | undefined> | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!env) return out
  for (const key of ENV_KEYS) {
    const value = env[key]
    if (typeof value === 'string' && value.trim()) out[key] = value.trim()
  }
  return out
}

const RISK_THRESHOLDS = { elevated: 0.75, moderate: 0.55 } as const

function riskFromProbability(p: number): 'low' | 'moderate' | 'elevated' {
  if (p >= RISK_THRESHOLDS.elevated) return 'elevated'
  if (p >= RISK_THRESHOLDS.moderate) return 'moderate'
  return 'low'
}

function intersectSymptoms(symptomIds: string[]): string[] {
  return [...symptomIds]
}

function uncertaintyLine(limitations: string[], warnings: string[]): string {
  return [...warnings, ...limitations].join(' ')
}

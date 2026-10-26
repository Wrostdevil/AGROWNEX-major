import { Router } from 'express'
import { fieldCreateSchema, fieldPatchSchema, fieldObservationSchema } from '../validators/schemas.js'
import { FieldProfile } from '../models/index.js'
import { requireDb } from '../config/db.js'
import { ApiErrorNotFound } from '../middleware/errors.js'
import { ah } from '../middleware/async.js'

export const fieldsRouter = Router()

/** Field profiles CRUD (§13). Coarse agronomy only — no geolocation stored. */

function withId(doc: Record<string, unknown>): Record<string, unknown> {
  return { ...doc, id: String(doc._id) }
}

function filterFields(fields: Record<string, unknown>, keep: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of keep) if (key in fields) out[key] = fields[key]
  return out
}

fieldsRouter.get('/', ah(async (req, res) => {
  requireDb()
  const limit = Math.min(Number(req.query.limit ?? 50), 100)
  const filter: Record<string, unknown> = {}
  if (typeof req.query.cropId === 'string' && req.query.cropId) filter.cropId = req.query.cropId
  const docs = await FieldProfile.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
  res.json({
    items: docs.map((d) => withId(d as unknown as Record<string, unknown>)),
    notice: 'Field records store no GPS coordinates — location precision is intentionally limited.',
  })
}))

fieldsRouter.get('/:id', ah(async (req, res) => {
  requireDb()
  const doc = await FieldProfile.findById(req.params.id).lean()
  if (!doc) throw new ApiErrorNotFound(`No field with id ${req.params.id}`)
  res.json(withId(doc as unknown as Record<string, unknown>))
}))

fieldsRouter.post('/', ah(async (req, res) => {
  requireDb()
  const input = fieldCreateSchema.parse(req.body ?? {})
  const doc = await FieldProfile.create(input)
  res.status(201).json(withId(doc.toObject()))
}))

fieldsRouter.patch('/:id', ah(async (req, res) => {
  requireDb()
  const patch = fieldPatchSchema.parse(req.body ?? {})
  const keep = ['name', 'cropId', 'variety', 'areaValue', 'areaUnit', 'plantedOn', 'notes', 'soil', 'irrigation']
  const doc = await FieldProfile.findByIdAndUpdate(req.params.id, filterFields(patch, keep), { new: true, runValidators: true })
  if (!doc) throw new ApiErrorNotFound(`No field with id ${req.params.id}`)
  res.json(withId(doc.toObject()))
}))

fieldsRouter.delete('/:id', ah(async (req, res) => {
  requireDb()
  const doc = await FieldProfile.findByIdAndDelete(req.params.id)
  if (!doc) throw new ApiErrorNotFound(`No field with id ${req.params.id}`)
  res.json({ deleted: String(doc._id) })
}))

fieldsRouter.post('/:id/observations', ah(async (req, res) => {
  requireDb()
  const observation = fieldObservationSchema.parse(req.body ?? {})
  const doc = await FieldProfile.findByIdAndUpdate(
    req.params.id,
    { $push: { observations: observation } },
    { new: true, runValidators: true },
  )
  if (!doc) throw new ApiErrorNotFound(`No field with id ${req.params.id}`)
  res.json(withId(doc.toObject()))
}))

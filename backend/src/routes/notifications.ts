import { Router } from 'express'
import { notificationPatchSchema } from '../validators/schemas.js'
import { Notification } from '../models/index.js'
import { requireDb } from '../config/db.js'
import { ApiErrorNotFound } from '../middleware/errors.js'
import { ah } from '../middleware/async.js'

export const notificationsRouter = Router()

/** Notification center backend: list + mark-read. */

notificationsRouter.get('/', ah(async (_req, res) => {
  requireDb()
  const items = await Notification.find().sort({ createdAt: -1 }).limit(50).lean()
  res.json({
    items: items.map((d) => ({ ...d, id: String(d._id) })),
    unreadCount: items.filter((d) => !d.read).length,
    notice: 'Backend notifications are informational only and label their own sample provenance.',
  })
}))

notificationsRouter.patch('/:id', ah(async (req, res) => {
  requireDb()
  const { read } = notificationPatchSchema.parse(req.body ?? {})
  const doc = await Notification.findByIdAndUpdate(req.params.id, { read }, { new: true })
  if (!doc) throw new ApiErrorNotFound(`No notification with id ${req.params.id}`)
  res.json({ ...doc.toObject(), id: String(doc._id) })
}))

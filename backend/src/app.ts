import express, { type Express, type RequestHandler } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { randomUUID } from 'node:crypto'
import { ALLOWED_ORIGINS, env } from './config/env.js'
import { requestLogger } from './utils/logger.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { healthRouter } from './routes/health.js'
import { diagnosesRouter } from './routes/diagnoses.js'
import { treatmentsRouter } from './routes/treatments.js'
import { communityRouter } from './routes/community.js'
import { assistantRouter } from './routes/assistant.js'
import { fieldsRouter } from './routes/fields.js'
import { notificationsRouter } from './routes/notifications.js'
import { researchRouter } from './routes/research.js'
import { dashboardRouter } from './routes/dashboard.js'

/** Express app factory (kept testable — no listen() here). */
export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }))
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true)
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
        return callback(new Error(`Origin ${origin} is not in CORS_ORIGINS`))
      },
    }),
  )
  app.use(express.json({ limit: '256kb' }))

  // Correlation id for tracing a request across API/ML logs.
  app.use((req, res, next) => {
    res.setHeader('x-request-id', (req.headers['x-request-id'] as string) || randomUUID())
    next()
  })
  app.use(requestLogger)

  const apiLimiter = rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false })
  app.use('/api', apiLimiter as RequestHandler)

  app.get('/', (_req, res) => {
    res.json({ service: 'agrownex-api', docs: '/api/health for health status' })
  })

  app.use('/api/health', healthRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/diagnoses', diagnosesRouter)
  app.use('/api/treatments', treatmentsRouter)
  app.use('/api/community', communityRouter)
  app.use('/api/assistant', assistantRouter)
  app.use('/api/fields', fieldsRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/research', researchRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

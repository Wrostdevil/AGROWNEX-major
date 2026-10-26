import { createApp } from './app.js'
import { connectDatabase, databaseStatus } from './config/db.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'
import { seedIfEmpty } from './scripts/seed.js'
import { mlStatus } from './services/mlClient.js'

async function main(): Promise<void> {
  await connectDatabase()
  try {
    await seedIfEmpty()
  } catch (err) {
    // Seeding failures (e.g. no database yet) must never block the API boot.
    logger.warn('seed step skipped/failed', { message: err instanceof Error ? err.message : String(err) })
  }

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    const db = databaseStatus()
    logger.info('Agrownex API listening', {
      port: env.PORT,
      env: env.NODE_ENV,
      db: db.connected ? 'connected' : 'UNAVAILABLE (DB-bound routes return 503 with setup instructions)',
      cors: env.CORS_ORIGINS,
    })
    if (!db.connected) {
      logger.warn('MongoDB is not connected — persistent routes are disabled until MONGODB_URI points at a reachable server.')
    }
  })

  // Startup self-check on ML readiness, logged honestly (never blocks boot).
  const ml = await mlStatus()
  if (!ml.reachable) {
    logger.warn('ML service unreachable — diagnosis creation will return 503 MODEL_UNAVAILABLE until it starts.', { instructions: ml.instructions })
  } else if (!ml.trained) {
    logger.warn('ML service reachable but no trained artifacts — run: cd ml-service && python -m training.make_fixture && python -m training.train')
  }

  const shutdown = async () => {
    logger.info('shutting down')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 4000)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  logger.error('fatal startup error', { message: err instanceof Error ? err.message : String(err) })
  process.exit(1)
})

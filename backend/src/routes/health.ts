import { Router } from 'express'
import { databaseStatus } from '../config/db.js'
import { mlStatus } from '../services/mlClient.js'
import { llmConfigured } from '../services/agent/provider.js'
import { env } from '../config/env.js'
import { ah } from '../middleware/async.js'

export const healthRouter = Router()

/**
 * Aggregated health endpoint. Distinguishes API up vs database readiness vs
 * model readiness — never pretends everything is fine when a dependency is
 * missing; the `status` field is "ok" only when DB and model are both ready,
 * "degraded" when the API is alive but dependencies are not.
 */
healthRouter.get('/', ah(async (_req, res) => {
  const db = databaseStatus()
  const ml = await mlStatus()
  const status = db.connected && ml.reachable && ml.trained ? 'ok' : 'degraded'
  res.json({
    status,
    service: 'agrownex-api',
    time: new Date().toISOString(),
    api: { up: true, provider: 'express' },
    db: { ready: db.connected, state: db.connected ? 'connected' : 'unavailable', message: db.message },
    ml: {
      reachable: ml.reachable,
      trained: ml.trained,
      model: ml.model,
      ...(ml.instructions ? { instructions: ml.instructions } : {}),
      ...(ml.detail ? { detail: ml.detail } : {}),
    },
    agent: {
      provider: llmConfigured() ? `openai-compatible:${env.LLM_MODEL}` : 'deterministic-fallback',
      mode: llmConfigured() ? 'llm' : 'deterministic-fallback',
    },
    demoNotice:
      'All returned agricultural values remain sample/demo data until curated datasets are reviewed; see /api/research/metrics for the documented rules.',
  })
}))

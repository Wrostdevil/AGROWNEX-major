import 'dotenv/config'
import { z } from 'zod'

/**
 * Central, validated environment configuration. Fails loudly at boot if the
 * environment is malformed — never silently misconfigures the app.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/agrownex'),
  ML_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
  ML_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  LLM_PROVIDER: z.enum(['none', 'openai-compatible']).default('none'),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  ALERT_ATTENTION_RATIO: z.coerce.number().positive().default(1.6),
  ALERT_WATCH_RATIO: z.coerce.number().positive().default(1.22),
  ALERT_WATCH_FLOOR: z.coerce.number().int().nonnegative().default(5),
  ALERT_ATTENTION_FLOOR: z.coerce.number().int().nonnegative().default(10),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof EnvSchema>

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid backend environment (.env):\n${details}`)
  }
  return parsed.data
}

export const env = loadEnv()

export const ALLOWED_ORIGINS = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean)

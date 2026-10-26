import mongoose, { type ConnectionStates } from 'mongoose'
import { env } from './env.js'
import { ApiError503 } from '../middleware/errors.js'

/**
 * MongoDB connection with honest status reporting.
 *
 * The backend starts even when MongoDB is unavailable; DB-bound routes answer
 * 503 with setup instructions instead of pretending persistence works.
 */
export type DbState =
  | { connected: false; reason: 'not-initialized' | 'error'; message: string }
  | { connected: true; message: string }

let lastError: { message: string } | null = null

export async function connectDatabase(): Promise<void> {
  lastError = null
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
  } catch (err) {
    lastError = { message: err instanceof Error ? err.message : String(err) }
    // Intentionally not rethrown: the API stays up and reports degraded health.
  }
}

const CONNECTED = 1 as ConnectionStates

export function databaseStatus(): DbState {
  const state = mongoose.connection.readyState
  if (state === CONNECTED) {
    return { connected: true, message: `connected to ${maskUri(env.MONGODB_URI)}` }
  }
  if (state === 2) {
    return { connected: false, reason: 'error', message: 'connecting to MongoDB…' }
  }
  if (lastError) {
    return {
      connected: false,
      reason: 'error',
      message: `MongoDB unreachable at ${maskUri(env.MONGODB_URI)} — ${lastError.message}. Install MongoDB Community Server and run it locally (mongodb://127.0.0.1:27017), or configure an Atlas URI in backend/.env → MONGODB_URI.`,
    }
  }
  return {
    connected: false,
    reason: 'not-initialized',
    message: `MongoDB not connected (readyState=${state}). Configure MONGODB_URI in backend/.env.`,
  }
}

/** Throws ApiError503 with setup instructions when the database is not ready. */
export function requireDb(): void {
  const s = databaseStatus()
  if (!s.connected) throw new ApiError503(s.message)
}

export function maskUri(uri: string): string {
  try {
    const u = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'https://'))
    const scheme = uri.startsWith('mongodb+srv') ? 'mongodb+srv' : 'mongodb'
    return `${scheme}://${u.password ? '<user>:<pass>@' : ''}${u.host}${u.pathname}`
  } catch {
    return '<configured-uri>'
  }
}

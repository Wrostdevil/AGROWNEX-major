/**
 * Centralized API client (§15).
 *
 * - Base URL from VITE_API_BASE_URL (defaults to the documented local port).
 * - Consistent JSON handling, timeouts and error normalisation.
 * - No API secrets live here; auth is out of scope for the single-user
 *   research project (documented in the root README).
 */

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://127.0.0.1:5000'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown
  readonly instructions?: string

  constructor(status: number, code: string, message: string, details?: unknown, instructions?: string) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    this.instructions = instructions
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

export class ApiUnavailableError extends ApiError {
  constructor(message: string) {
    super(0, 'API_UNREACHABLE', message)
  }
}

function timeout(ms: number): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, done: () => clearTimeout(timer) }
}

export async function apiFetch<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 12_000, ...rest } = init
  const { signal, done } = timeout(timeoutMs)
  try {
    let res: Response
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: { 'content-type': 'application/json', ...(rest.headers ?? {}) },
        signal,
      })
    } catch (err) {
      throw new ApiUnavailableError(
        err instanceof DOMException && err.name === 'AbortError'
          ? `Request timed out after ${timeoutMs}ms`
          : 'API unreachable — is the backend running? (cd backend && npm run dev)',
      )
    }
    if (!res.ok) {
      let parsed: { error?: { code?: string; message?: string; details?: unknown }; detail?: { code?: string; message?: string; instructions?: string } } | null = null
      try {
        parsed = await res.json()
      } catch {
        parsed = null
      }
      // Backend uses two shapes: flat {error:{...}} and FastAPI-style {detail:{...}}
      const errInfo = parsed?.error
      const detail = parsed?.detail
      throw new ApiError(
        res.status,
        errInfo?.code ?? detail?.code ?? `HTTP_${res.status}`,
        errInfo?.message ?? detail?.message ?? `Request failed (${res.status})`,
        errInfo?.details,
        detail?.instructions,
      )
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  } finally {
    done()
  }
}

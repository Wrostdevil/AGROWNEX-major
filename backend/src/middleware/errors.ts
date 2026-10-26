import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Error as MongooseError } from 'mongoose'
import { logger } from '../utils/logger.js'

/** Application error type with an HTTP status + stable machine-readable code. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export class ApiErrorBadRequest extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, 'BAD_REQUEST', message, details)
  }
}
export class ApiErrorNotFound extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message)
  }
}
export class ApiError503 extends ApiError {
  constructor(message: string, code = 'UNAVAILABLE') {
    super(503, code, message)
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route: ${req.method} ${req.originalUrl}` } })
}

/**
 * Centralized error handler. Raw internal details (stacks) are logged but never
 * returned to the frontend; Zod/Mongoose validation issues are summarised safely.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    })
    return
  }
  if (err instanceof MongooseError.ValidationError || err instanceof MongooseError.CastError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Document validation failed' } })
    return
  }
  logger.error('unhandled error', {
    path: req.originalUrl,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  })
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error. Check API logs for details.' } })
}

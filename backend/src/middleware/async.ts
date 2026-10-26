import type { RequestHandler } from 'express'

/**
 * Async handler wrapper for Express 4: forwards thrown errors and rejected
 * promises to the error middleware instead of crashing the process.
 */
export function ah(fn: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => unknown): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

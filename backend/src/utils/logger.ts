import type { Request, Response, NextFunction } from 'express'

/** Structured, minimal logger (JSON lines). Never logs secrets. */
function emit(level: 'info' | 'warn' | 'error', msg: string, meta?: unknown) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, service: 'agrownex-api', msg, ...(meta !== undefined ? { meta } : {}) })
  if (level === 'error') console.error(line)
  else console.log(line)
}

export const logger = {
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    if (req.path === '/api/health') return // avoid noisy heartbeat logs
    logger.info('http request', { method: req.method, path: req.originalUrl, status: res.statusCode, ms: Date.now() - start })
  })
  next()
}

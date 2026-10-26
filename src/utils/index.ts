import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompactINR(amount: number): string {
  return '₹' + new Intl.NumberFormat('en-IN').format(amount)
}

export function formatDate(iso: string | number): string {
  const d = typeof iso === 'string' ? new Date(iso + 'T00:00:00') : new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatShortDate(iso: string | number): string {
  const d = typeof iso === 'string' ? new Date(iso + 'T00:00:00') : new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const abs = Math.abs(diff)
  const min = 60_000
  const hour = 60 * min
  const day = 24 * hour
  if (abs < min) return 'just now'
  if (abs < hour) return `${Math.round(abs / min)} min ago`
  if (abs < day) return `${Math.round(abs / hour)} hr ago`
  const days = Math.round(abs / day)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.round(days / 7)} wk ago`
  const months = Math.round(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

export function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function titleCase(s: string): string {
  return s.replace(/(^|[\s-])(\w)/g, (m) => m.toUpperCase())
}

/** Deterministic zero-arg uid good enough for local records. */
export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

export function tsDaysAgo(days: number, hours = 0): number {
  return Date.now() - (days * 24 + hours) * 3_600_000
}

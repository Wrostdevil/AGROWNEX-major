/** Date helpers shared by seeding and tests (deterministic, ISO-based). */

export function isoSampleDaysAgo(daysBack: number): string {
  const date = new Date(Date.now() - daysBack * 86_400_000)
  return date.toISOString().slice(0, 10)
}

export const isoDaysAgoSample = isoSampleDaysAgo

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

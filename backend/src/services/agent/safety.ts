import type { AgentResponse } from './types.js'

/**
 * Deterministic safety review (§10.6) — runs on every composed response:
 * 1. Verifies required uncertainty notices are present.
 * 2. Flags unsupported claims: outbreak confirmations, guaranteed cures,
 *    invented accuracy numbers, or dosage-style recommendations.
 * 3. Confirms tool-grounded responses reference at least one tool output.
 */
export interface SafetyFinding {
  rule: string
  severity: 'block' | 'warn'
  message: string
}

const UNCERTAINTY_MARKERS = [
  'not a confirmed outbreak',
  'not a diagnosis',
  'not verified',
  'sample',
  'illustrative',
  'consult',
  'extension office',
  'uncertaint',
]

/**
 * Overclaim scanning must not flag the mandatory uncertainty notice itself
 * ("…is not a confirmed outbreak…"), so each match is only counted when the
 * preceding context contains no negation word.
 */
function overclaimFlag(text: string, pattern: RegExp): boolean {
  const globalRe = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)
  for (const match of text.matchAll(globalRe)) {
    const index = match.index ?? 0
    const before = text.slice(Math.max(0, index - 70), index)
    if (!/\b(not|never|no|nothing|isn'?t|is not)\b/i.test(before)) return true
  }
  return false
}

export function validateResponse(
  text: string,
  opts: { groundedToolCount: number; mode: string },
): SafetyFinding[] {
  const findings: SafetyFinding[] = []
  const lower = text.toLowerCase()

  const hasUncertainty = UNCERTAINTY_MARKERS.some((m) => lower.includes(m))
  if (!hasUncertainty) {
    findings.push({
      rule: 'uncertainty-notice',
      severity: 'block',
      message: 'Response must carry an explicit uncertainty/demo-data notice.',
    })
  }

  const overclaimPatterns = [
    /\bconfirmed outbreak\b/i,
    /\boutbreak confirmed\b/i,
    /\bcertain diagnosis\b/i,
    /\b100%\s+(certain|accurate)\b/i,
    /\bguaranteed\s+(cure|result)\b/i,
  ]
  if (overclaimPatterns.some((p) => overclaimFlag(text, p))) {
    findings.push({
      rule: 'no-overclaim',
      severity: 'block',
      message: 'Overclaiming language detected (outbreak confirmation / guarantee).',
    })
  }

  const dosageAdvice = /(spray\s+\d+\s*(ml|g|kg|litre|liter)|apply\s+\d+\s*(ml|g)\s*\/\s*(acre|hectare|l))/i.test(text)
  if (dosageAdvice) {
    findings.push({
      rule: 'no-dosage',
      severity: 'block',
      message: 'Dosage-style recommendation detected; only certified advisory sources may give dosages.',
    })
  }

  if (opts.groundedToolCount === 0) {
    findings.push({
      rule: 'grounding',
      severity: 'warn',
      message: 'Response contains no grounded tool output — check that the right tools ran.',
    })
  }

  return findings
}

/** Throws when a blocking finding exists (orchestrator then rewrites the reply). */
export function enforce(findings: SafetyFinding[]): void {
  const blocking = findings.filter((f) => f.severity === 'block')
  if (blocking.length > 0) {
    const detail = blocking.map((b) => `${b.rule}: ${b.message}`).join(' | ')
    throw new Error(`Safety review blocked the response (${detail})`)
  }
}

/** Appends a standard safety footer for the demo assistant surface. */
export function safetyFooter(response: AgentResponse): string {
  return [
    '',
    'Limits: this assistant runs on demo data and curated sample records. It is not a certified diagnosis, treatment prescription, or outbreak warning. Verify with your local agricultural extension service.',
  ].join('\n')
}

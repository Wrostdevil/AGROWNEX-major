/**
 * Typed endpoint catalogue for the Express API. One place, no scattered
 * endpoint strings (§15). Response types map onto the existing frontend
 * contracts so callers can switch between API and local mode cleanly.
 */
import { apiFetch } from './apiClient'

// ---------------------------------------------------------------------------
// Health / connection status
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: 'ok' | 'degraded'
  api: { up: boolean }
  db: { ready: boolean; state: string; message: string }
  ml: { reachable: boolean; trained: boolean; model: string | null; instructions?: string; detail?: string }
  agent: { provider: string; mode: string }
}

export function apiHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health', { timeoutMs: 5_000 })
}

// ---------------------------------------------------------------------------
// Diagnoses (analyses)
// ---------------------------------------------------------------------------

export interface ApiPredictionResponse {
  id: string
  createdAt: string
  conditionId: string
  conditionName: string
  probabilityTop: number
  riskBand: 'low' | 'moderate' | 'elevated'
  probabilities: Array<{ conditionId: string; name: string; probability: number }>
  matchedSymptoms: string[]
  analysis: {
    conditionId: string
    conditionName: string
    probabilityTop: number
    riskBand: 'low' | 'moderate' | 'elevated'
    probabilities: Array<{ conditionId: string; name: string; probability: number }>
    matchedSymptoms: string[]
    features: Array<{ key: string; label: string; value: string; contribution: number; direction: 'supports' | 'against' }>
    uncertaintyNote: string
    modelMeta: { name: string; version: string; task: string; trained: boolean; limitations: string[] }
    warnings: string[]
    modelInfo: { name: string; version: string; task: string; trained: boolean; limitations: string[] }
  }
  notice: string
}

export interface DiagnosisPayload {
  cropId: string
  label?: string
  symptomIds: string[]
  environment: Record<string, string | undefined>
  notes?: string
}

export function createDiagnosis(payload: DiagnosisPayload): Promise<ApiPredictionResponse> {
  return apiFetch<ApiPredictionResponse>('/api/diagnoses', {
    method: 'POST',
    body: JSON.stringify({ ...payload, strictModel: true }),
    timeoutMs: 20_000,
  })
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export interface ApiCommunityReport {
  id: string
  regionId: string
  cropId: string
  symptomId: string
  observedOn: string
  notes?: string
}

export function createCommunityReport(input: Omit<ApiCommunityReport, 'id'>): Promise<ApiCommunityReport> {
  return apiFetch<ApiCommunityReport>('/api/community/reports', { method: 'POST', body: JSON.stringify(input) })
}

export interface ApiTrend {
  regionId: string
  regionName: string
  cropId: string
  cropName: string
  symptomId: string
  symptomName: string
  recentCount: number
  priorCount: number
  ratio: number | null
  level: 'steady' | 'watch' | 'attention'
  trendSummary: string
  uncertaintyNote: string
  windowLabel: string
}

export function communityTrends(params: Record<string, string | undefined> = {}): Promise<{ windowDays: number; trends: ApiTrend[]; weekly: Array<{ week: string; count: number }> }> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
  const suffix = qs.toString() ? `?${qs}` : ''
  return apiFetch(`/api/community/trends${suffix}`)
}

export function communityAlerts(): Promise<{ windowDays: number; alerts: Array<Record<string, unknown>>; rule: string }> {
  return apiFetch('/api/community/alerts')
}

// ---------------------------------------------------------------------------
// Assistant
// ---------------------------------------------------------------------------

export interface ApiAssistantMessage {
  id: string
  role: 'assistant'
  content: string
  createdAt: string
  provider: string
  agentSteps: Array<{ id: string; label: string; detail?: string; capability: string; status: string }>
  contextCards: Array<{ title: string; value: string; meta?: string }>
  related: Array<{ label: string; to: string }>
}

export function sendAssistantMessage(input: {
  message: string
  conversationId?: string
  cropId?: string
  regionId?: string
  budget?: number
}): Promise<{ conversationId: string; message: ApiAssistantMessage; suggestedFollowUp: string[]; limitations: string[] }> {
  return apiFetch('/api/assistant/messages', { method: 'POST', body: JSON.stringify(input), timeoutMs: 25_000 })
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export interface ApiRankedTreatment {
  optionId: string
  name: string
  category: string
  costBand: string
  costMidpointLabel: string
  withinBudget: boolean
  score: number
  rationale: string
  effectivenessDisclosed?: string
  safetyNotes: string
  evidenceStatus: string
  sourceNote: string
}

export function rankTreatments(input: { budget: number; conditionId?: string }): Promise<{ budget: number; eligible: number; ranked: ApiRankedTreatment[]; notice: string }> {
  return apiFetch('/api/treatments/rank', { method: 'POST', body: JSON.stringify(input) })
}

// ---------------------------------------------------------------------------
// Notifications / fields
// ---------------------------------------------------------------------------

export function apiNotifications(): Promise<{ items: Array<{ id: string; kind: string; title: string; body: string; read: boolean; createdAt: string }>; unreadCount: number }> {
  return apiFetch('/api/notifications')
}

export function markNotificationRead(id: string, read: boolean): Promise<{ id: string; read: boolean }> {
  return apiFetch(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) })
}

export function apiFields(): Promise<{ items: Array<Record<string, unknown>>; notice: string }> {
  return apiFetch('/api/fields')
}

// ---------------------------------------------------------------------------
// Research metrics
// ---------------------------------------------------------------------------

export function researchMetrics(): Promise<{
  components: Array<{ id: string; title: string; task?: string; modelStatus?: Record<string, unknown>; method?: string; rule?: unknown; thresholds?: unknown; note?: string; caveats?: string; metricsSource?: string }>
  experimentRepro: Record<string, string>
  honesty: string
}> {
  return apiFetch('/api/research/metrics')
}

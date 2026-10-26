/**
 * Agent orchestrator types — shared contracts for tools, provider and the
 * orchestrator itself (mirrored by the frontend assistant message shape).
 */

export type ToolId = 'crop-analysis' | 'treatment-ranking' | 'community-monitor' | 'knowledge-retrieval'

export interface ToolTrace {
  tool: ToolId
  status: 'done' | 'error' | 'unavailable'
  detail: string
  /** grounded data returned by the tool (never fabricated) */
  result?: unknown
  startedAt: number
  finishedAt: number
}

export interface ContextCard {
  title: string
  value: string
  meta?: string
}

export interface AgentStepView {
  id: string
  label: string
  detail?: string
  capability: string
  status: 'scheduled' | 'active' | 'done'
}

export interface AgentResponse {
  content: string
  provider: string
  steps: AgentStepView[]
  toolTraces: ToolTrace[]
  contextCards: ContextCard[]
  related: Array<{ label: string; to: string }>
  suggestedFollowUp: string[]
  limitations: string[]
  /** provenance extras for the frontend demo surface */
  safetyNote?: string
  dbConnected?: boolean
  mode?: string
}

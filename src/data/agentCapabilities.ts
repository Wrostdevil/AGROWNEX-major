import type { AgentCapability } from '../types'

/**
 * Agent architecture contracts — the frontend's view of the orchestrator +
 * capability design. Today they are rendered as explanatory panels and
 * simulated activity steps; each capability maps to a real FastAPI endpoint
 * or tool behind the orchestrator as the platform matures.
 */

export const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    id: 'orchestrator',
    name: 'Main orchestrator',
    role: 'Coordinates every request, decides which capability answers, and sequences tools.',
    tools: ['request routing', 'turn state', 'response assembly'],
    status: 'simulated',
  },
  {
    id: 'knowledge',
    name: 'Agricultural knowledge & context',
    role: 'Collects missing crop details and retrieves trusted agricultural information.',
    tools: ['context gathering', 'missing-info prompts'],
    status: 'simulated',
  },
  {
    id: 'analysis',
    name: 'Crop analysis',
    role: 'Invokes the ML prediction service with suitable explanation methods (SHAP where the model family supports it).',
    tools: ['prediction service', 'XAI service'],
    status: 'simulated',
  },
  {
    id: 'treatment',
    name: 'Cost-aware treatment',
    role: 'Retrieves available treatment information and runs the deterministic, constraint-first ranking engine.',
    tools: ['treatment catalogue', 'ranking engine'],
    status: 'simulated',
  },
  {
    id: 'community',
    name: 'Community early warning',
    role: 'Analyses aggregated reports across regions and time windows to surface potential trends with uncertainty language.',
    tools: ['report aggregation', 'trend heuristics'],
    status: 'simulated',
  },
  {
    id: 'safety',
    name: 'Safety review',
    role: 'Checks recommendations against supported evidence and defined constraints; blocks invented claims.',
    tools: ['evidence check', 'claim guard'],
    status: 'designed',
  },
]

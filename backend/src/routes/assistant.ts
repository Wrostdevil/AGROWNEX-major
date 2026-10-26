import { Router } from 'express'
import { assistantMessageSchema } from '../validators/schemas.js'
import { AssistantConversation } from '../models/index.js'
import { requireDb } from '../config/db.js'
import { ApiErrorNotFound } from '../middleware/errors.js'
import { ah } from '../middleware/async.js'
import { orchestrate } from '../services/agent/orchestrator.js'

export const assistantRouter = Router()

/**
 * Assistant orchestration endpoints (§10). Messages run the real orchestrator
 * (rule routing + tool execution + safety review) with either the configured
 * LLM provider or the labelled deterministic fallback. Conversations persist
 * in MongoDB for history.
 */

assistantRouter.post('/messages', ah(async (req, res) => {
  requireDb()
  const input = assistantMessageSchema.parse(req.body ?? {})
  const response = await orchestrate({
    question: input.message,
    context: { cropping: { cropId: input.cropId, regionId: input.regionId, budget: input.budget } },
  })

  let conversation
  if (input.conversationId) {
    conversation = await AssistantConversation.findById(input.conversationId)
    if (!conversation) throw new ApiErrorNotFound(`No conversation with id ${input.conversationId}`)
  } else {
    conversation = await AssistantConversation.create({
      title: input.message.slice(0, 60),
      messages: [],
    })
  }
  conversation.messages.push({ role: 'user', content: input.message, createdAt: new Date() })
  conversation.messages.push({
    role: 'assistant',
    content: response.content,
    createdAt: new Date(),
    provider: response.provider,
    toolTrace: response.toolTraces,
    contextCards: response.contextCards,
    related: response.related,
    agentSteps: response.steps,
  })
  await conversation.save()

  res.status(201).json({
    conversationId: String(conversation._id),
    message: {
      id: String(conversation.messages[conversation.messages.length - 1]._id ?? crypto.randomUUID()),
      role: 'assistant',
      content: response.content,
      createdAt: new Date().toISOString(),
      provider: response.provider,
      agentSteps: response.steps,
      contextCards: response.contextCards,
      related: response.related,
      toolTrace: response.toolTraces,
    },
    suggestedFollowUp: response.suggestedFollowUp,
    limitations: response.limitations,
  })
}))

assistantRouter.get('/conversations', ah(async (_req, res) => {
  requireDb()
  const convos = await AssistantConversation.find().sort({ updatedAt: -1 }).limit(30).lean()
  res.json({
    items: convos.map((c) => ({
      id: String(c._id),
      title: c.title,
      messageCount: c.messages.length,
      updatedAt: c.updatedAt,
      preview: c.messages[c.messages.length - 1]?.content?.slice(0, 140) ?? '',
    })),
  })
}))

assistantRouter.get('/conversations/:id', ah(async (req, res) => {
  requireDb()
  const convo = await AssistantConversation.findById(req.params.id).lean()
  if (!convo) throw new ApiErrorNotFound(`No conversation with id ${req.params.id}`)
  res.json({
    id: String(convo._id),
    title: convo.title,
    createdAt: convo.createdAt,
    updatedAt: convo.updatedAt,
    messages: (convo.messages ?? []).map((m) => ({ ...m, id: String(m._id ?? crypto.randomUUID()) })),
  })
}))

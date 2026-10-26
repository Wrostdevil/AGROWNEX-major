import { Schema, model, type InferSchemaType } from 'mongoose'
import { CROPS, SYMPTOM_IDS, REGIONS, ENV_ENUMS, OBSERVATION_MOODS } from '../domain/catalog.js'

// ---------------------------------------------------------------------------
// fieldProfiles
// ---------------------------------------------------------------------------

const cropObservationSchema = new Schema(
  {
    observedOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    note: { type: String, required: true, maxLength: 500 },
    mood: { type: String, required: true, enum: OBSERVATION_MOODS },
  },
  { _id: true },
)

const fieldProfileSchema = new Schema(
  {
    ownerIdKey: { type: String, default: 'local-demo' }, // single-user research prototype
    name: { type: String, required: true, maxLength: 80, trim: true },
    cropId: { type: String, required: true, enum: CROPS },
    variety: { type: String, maxLength: 80, trim: true },
    areaValue: { type: Number, required: true, min: 0, max: 10_000 },
    areaUnit: { type: String, required: true, enum: ['acre', 'hectare'] },
    plantedOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    notes: { type: String, maxLength: 500, trim: true },
    soil: { type: String, maxLength: 120, trim: true },
    irrigation: { type: String, maxLength: 120, trim: true },
    observations: { type: [cropObservationSchema], default: [] },
  },
  { timestamps: true },
)
fieldProfileSchema.index({ createdAt: -1 })
fieldProfileSchema.index({ cropId: 1 })

export type FieldProfileDoc = InferSchemaType<typeof fieldProfileSchema>
export const FieldProfile = model('fieldProfiles', fieldProfileSchema)

// ---------------------------------------------------------------------------
// cropAnalyses
// ---------------------------------------------------------------------------

const explanationFeatureSchema = new Schema(
  {
    key: String,
    label: String,
    value: String,
    contribution: Number,
    direction: { type: String, enum: ['supports', 'against'] },
  },
  { _id: false },
)

const cropAnalysisSchema = new Schema(
  {
    ownerIdKey: { type: String, default: 'local-demo' },
    cropId: { type: String, required: true, enum: CROPS },
    cropName: { type: String, required: true },
    label: { type: String, maxLength: 120 },
    symptomIds: { type: [String], required: true },
    environment: { type: Schema.Types.Mixed, default: {} },
    notes: { type: String, maxLength: 500 },
    conditionId: { type: String, required: true },
    conditionName: { type: String, required: true },
    // Model posterior for the top class — NOT claimed to be calibrated.
    probabilityTop: { type: Number, required: true, min: 0, max: 1 },
    riskBand: { type: String, enum: ['low', 'moderate', 'elevated'], required: true },
    probabilities: { type: Schema.Types.Mixed, default: [] },
    matchedSymptoms: { type: [String], default: [] },
    features: { type: [explanationFeatureSchema], default: [] },
    uncertaintyNote: { type: String, required: true },
    modelMeta: { type: Schema.Types.Mixed, required: true },
    mlRequestId: { type: String },
    pipeline: { type: String, enum: ['ml-service', 'unavailable-fallback'], required: true } // provenance, never hidden
      ,
  },
  { timestamps: true, timestampsCreatedAt: true },
)
cropAnalysisSchema.index({ createdAt: -1 })
cropAnalysisSchema.index({ cropId: 1, conditionId: 1 })

export type CropAnalysisDoc = InferSchemaType<typeof cropAnalysisSchema>
export const CropAnalysis = model('cropAnalyses', cropAnalysisSchema)

// ---------------------------------------------------------------------------
// communityReports
// ---------------------------------------------------------------------------

const communityReportSchema = new Schema(
  {
    reporterKey: { type: String, default: 'local-demo' },
    regionId: { type: String, required: true, enum: REGIONS.map((r) => r.id) },
    cropId: { type: String, required: true, enum: CROPS },
    symptomId: { type: String, required: true, enum: SYMPTOM_IDS },
    observedOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    notes: { type: String, maxLength: 500, trim: true },
    // Coarse region only — precise geolocation is deliberately never stored.
  },
  { timestamps: true },
)
communityReportSchema.index({ regionId: 1, cropId: 1, symptomId: 1, observedOn: -1 })
communityReportSchema.index({ observedOn: -1 })

export type CommunityReportDoc = InferSchemaType<typeof communityReportSchema>
export const CommunityReport = model('communityReports', communityReportSchema)

// ---------------------------------------------------------------------------
// communityAlerts — persisted outputs of the documented trend rule
// ---------------------------------------------------------------------------

const communityAlertSchema = new Schema(
  {
    regionId: { type: String, required: true },
    cropId: { type: String, required: true },
    symptomId: { type: String, required: true },
    level: { type: String, required: true, enum: ['steady', 'watch', 'attention'] },
    windowLabel: { type: String, required: true },
    reportCounts: {
      recent: { type: Number, required: true, min: 0 },
      prior: { type: Number, required: true, min: 0 },
    },
    trendSummary: { type: String, required: true },
    uncertaintyNote: { type: String, required: true },
    computedAt: { type: Date, required: true },
  },
  { timestamps: true },
)
communityAlertSchema.index({ regionId: 1, cropId: 1, symptomId: 1, computedAt: -1 })

export type CommunityAlertDoc = InferSchemaType<typeof communityAlertSchema>
export const CommunityAlert = model('communityAlerts', communityAlertSchema)

// ---------------------------------------------------------------------------
// treatmentOptions (curated) + knowledgeSources
// ---------------------------------------------------------------------------

const treatmentOptionSchema = new Schema(
  {
    optionId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true, enum: ['cultural', 'biological', 'chemical-supportive'] },
    crops: { type: [String], default: [] },
    conditionIds: { type: [String], default: [] },
    // Illustrative cost band, clearly surfaced as estimates — never real prices.
    costMin: { type: Number, required: true, min: 0 },
    costMax: { type: Number, required: true, min: 0 },
    costUnit: { type: String, default: 'INR/acre', enum: ['INR/acre', 'INR/hectare'] },
    suitabilityScore: { type: Number, required: true, min: 0, max: 1 },
    effectivenessScore: { type: Number, min: 0, max: 1 }, // null when evidence missing
    evidenceStatus: { type: String, required: true, enum: ['sample-grade', 'sample-limited', 'unavailable'] },
    sourceNote: { type: String, default: '' },
    safetyNotes: { type: String, required: true },
    suitabilitySummary: { type: String, default: '' },
  },
  { timestamps: true },
)
treatmentOptionSchema.index({ conditionIds: 1 })

export type TreatmentOptionDoc = InferSchemaType<typeof treatmentOptionSchema>
export const TreatmentOption = model('treatmentOptions', treatmentOptionSchema)

const knowledgeSourceSchema = new Schema(
  {
    docId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true, maxLength: 4000 },
    crops: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    sourceNote: { type: String, default: '' },
    quality: { type: String, enum: ['curated-general', 'verification-pending'], default: 'curated-general' },
  },
  { timestamps: true },
)
knowledgeSourceSchema.index({ crops: 1, topics: 1 })

export type KnowledgeSourceDoc = InferSchemaType<typeof knowledgeSourceSchema>
export const KnowledgeSource = model('knowledgeSources', knowledgeSourceSchema)

// ---------------------------------------------------------------------------
// assistantConversations + notifications + auditEvents
// ---------------------------------------------------------------------------

const assistantMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxLength: 6000 },
    createdAt: { type: Date, required: true, default: Date.now },
    provider: { type: String, max: 60 }, // 'deterministic-fallback' | configured provider id
    toolTrace: { type: Schema.Types.Mixed, default: [] }, // OrchestratorToolTrace[] serialised
    contextCards: { type: Schema.Types.Mixed, default: [] },
    related: { type: Schema.Types.Mixed, default: [] },
    agentSteps: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: true },
)

const assistantConversationSchema = new Schema(
  {
    ownerIdKey: { type: String, default: 'local-demo' },
    title: { type: String, default: 'Demonstration conversation' },
    messages: { type: [assistantMessageSchema], default: [] },
  },
  { timestamps: true },
)
assistantConversationSchema.index({ updatedAt: -1 })

export type AssistantConversationDoc = InferSchemaType<typeof assistantConversationSchema>
export const AssistantConversation = model('assistantConversations', assistantConversationSchema)

const notificationSchema = new Schema(
  {
    ownerIdKey: { type: String, default: 'local-demo' },
    kind: { type: String, required: true, enum: ['community-watch', 'analysis-complete', 'comparison-saved', 'reminder'] },
    title: { type: String, required: true, maxLength: 160 },
    body: { type: String, required: true, maxLength: 2000 },
    read: { type: Boolean, default: false },
    link: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)
notificationSchema.index({ read: 1, createdAt: -1 })

export type NotificationDoc = InferSchemaType<typeof notificationSchema>
export const Notification = model('notifications', notificationSchema)

const auditEventSchema = new Schema(
  {
    event: { type: String, required: true, maxLength: 80 },
    actorKey: { type: String, default: 'local-demo' },
    detail: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)
auditEventSchema.index({ createdAt: -1 })
export type AuditEventDoc = InferSchemaType<typeof auditEventSchema>
export const AuditEvent = model('auditEvents', auditEventSchema)

export const ENV_ENUMS_REF = ENV_ENUMS

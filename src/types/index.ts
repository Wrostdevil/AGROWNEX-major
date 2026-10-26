/**
 * AgrowNex shared type contracts.
 *
 * These interfaces describe the frontend service layer. Each service is a
 * self-contained implementation backed by local persistence + typed data,
 * designed so the FastAPI / ML / SHAP backend can replace the internals
 * without changing presentation components.
 */

// ---------------------------------------------------------------------------
// Crop analysis
// ---------------------------------------------------------------------------

export type RiskBand = 'low' | 'moderate' | 'elevated'

export type SymptomCategory = 'leaf' | 'plant' | 'fruit-or-head'

export interface SymptomOption {
  id: string
  label: string
  category: SymptomCategory
}

export interface EnvironmentFactors {
  humidity: 'high' | 'normal' | 'low'
  recentRainfall: 'heavy' | 'moderate' | 'low'
  temperatureBand: '15-25' | '26-32' | 'above-32'
  soilMoisture: 'wet' | 'medium' | 'dry'
  drainage: 'poor' | 'adequate'
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting'
}

export interface CropAnalysisInput {
  cropId: string
  cropName: string
  variety?: string
  symptomIds: string[]
  environment?: Partial<EnvironmentFactors>
  imageId?: string
  notes?: string
}

export interface ExplanationFeature {
  key: string
  label: string
  /** Signed contribution. Positive pushes toward the predicted condition. */
  contribution: number
  direction: 'supports' | 'against'
  /** Farmer-friendly detail attached to the feature. */
  detail: string
  values: string
}

export interface CropAnalysisResult {
  id: string
  createdAt: number
  input: CropAnalysisInput
  conditionId: string
  /** Condition name shown to the user, e.g. "Early blight pattern" */
  conditionName: string
  /** Model confidence between 0 and 1. */
  confidence: number
  risk: RiskBand
  matchedSymptoms: string[]
  unmatchedContext: string[]
  features: ExplanationFeature[]
  plainSummary: string
  technicalSummary: string
  uncertaintyNote: string
  modelMeta: ModelMeta
}

export interface ModelMeta {
  name: string
  family: string
  method: string
  inputFeatures: string[]
  note: string
}

// ---------------------------------------------------------------------------
// Explanations (XAI)
// ---------------------------------------------------------------------------

export interface ExplanationRecord {
  result: CropAnalysisResult
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export type EvidenceStatus = 'sample-grade' | 'sample-limited' | 'unavailable'

export interface TreatmentOption {
  id: string
  name: string
  category: 'cultural' | 'biological' | 'chemical-supportive'
  /** Lower bound of the indicative cost band, in INR/acre. */
  costMin: number
  costMax: number
  /** Expected-effectiveness score (0..1) for well-matched conditions. */
  effectiveness: number
  suitabilityScore: number
  suitabilitySummary: string
  safetyNotes: string
  sourceNote: string
  evidenceStatus: EvidenceStatus
  conditionTags: string[]
}

// ---------------------------------------------------------------------------
// Community early warning
// ---------------------------------------------------------------------------

export interface CommunityRegion {
  id: string
  name: string
  tone: string // fill color used by the abstract region map
}

export interface CommunityReport {
  id: string
  createdAt: number
  regionId: string
  cropId: string
  symptomId: string
  observedOn: string // ISO date
  notes?: string
  sample: boolean // seeded starter reports are true; user submissions are false
}

export interface CommunityWeeklyPoint {
  week: number // index within the series
  label: string // "W-11" ... "This wk"
  count: number
}

export type AlertLevel = 'steady' | 'watch' | 'attention'

export interface CommunityAlert {
  id: string
  regionId: string
  cropId: string
  symptomId: string
  level: AlertLevel
  windowLabel: string
  reportCounts: { recent: number; prior: number }
  trendSummary: string
  uncertaintyNote: string
  computedAt: number
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export interface CropObservation {
  id: string
  observedOn: string // ISO date
  note: string
  mood: 'healthy' | 'mixed' | 'concern'
}

export interface FieldProfile {
  id: string
  name: string
  cropId: string
  variety?: string
  areaValue: number
  areaUnit: 'acre' | 'hectare'
  plantedOn: string // ISO date
  notes?: string
  soil?: string
  irrigation?: string
  observations: CropObservation[]
  createdAt: number
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export interface AnalysisHistoryRecord {
  id: string
  createdAt: number
  cropId: string
  cropName: string
  label: string
  conditionId: string
  conditionName: string
  confidence: number
  risk: RiskBand
  status: 'complete' | 'incomplete'
  source: 'sample' | 'user'
  thumbnail?: string
  result?: CropAnalysisResult
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationKind =
  | 'community-watch'
  | 'analysis-complete'
  | 'comparison-saved'
  | 'reminder'

export interface NotificationItem {
  id: string
  createdAt: number
  kind: NotificationKind
  title: string
  body: string
  read: boolean
  sample: boolean
  link?: { label: string; to: string }
}

// ---------------------------------------------------------------------------
// Assistant
// ---------------------------------------------------------------------------

export type AgentPhase = 'scheduled' | 'active' | 'done'

export interface AgentStep {
  id: string
  label: string
  detail?: string
  capability: string
  status: AgentPhase
}

export type AssistantRole = 'user' | 'assistant'

export interface AssistantContextCard {
  title: string
  value: string
  meta?: string
}

export interface AssistantMessage {
  id: string
  role: AssistantRole
  content: string
  createdAt: number
  suggested?: boolean
  contextCards?: AssistantContextCard[]
  related?: { label: string; to: string }[]
  agentSteps?: AgentStep[]
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export interface Preferences {
  theme: 'light' | 'dark'
  reducedMotion: boolean
  language: 'en' | 'hi' | 'te' | 'mr'
  units: 'metric' | 'imperial'
  areaUnit: 'acre' | 'hectare'
  notifyCommunity: boolean
  notifyAnalysis: boolean
  notifyReminders: boolean
  defaultRegionId: string
  /** Display name shown on the profile menu; empty string until onboarding sets it. */
  profileName: string
  onboardedAt: number | null
}

// ---------------------------------------------------------------------------
// Agent architecture capability contract (frontend view only)
// ---------------------------------------------------------------------------

export interface AgentCapability {
  id: string
  name: string
  role: string
  tools: string[]
  status: 'designed' | 'simulated'
}

import { z } from 'zod'
import { CROPS, SYMPTOM_IDS, REGIONS, ENV_ENUMS, OBSERVATION_MOODS } from '../domain/catalog.js'

/** Shared request validators — one canonical place for every route's schema. */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use ISO date YYYY-MM-DD')
const optionalEnum = (values: readonly string[]) => z.enum(values as never).optional()

export const environmentSchema = z
  .object({
    humidity: optionalEnum(ENV_ENUMS.humidity),
    recentRainfall: optionalEnum(ENV_ENUMS.recentRainfall),
    temperatureBand: optionalEnum(ENV_ENUMS.temperatureBand),
    soilMoisture: optionalEnum(ENV_ENUMS.soilMoisture),
    drainage: optionalEnum(ENV_ENUMS.drainage),
    growthStage: optionalEnum(ENV_ENUMS.growthStage),
  })
  .strict()

export const diagnosisCreateSchema = z
  .object({
    cropId: z.enum(CROPS as never),
    label: z.string().max(120).optional(),
    symptomIds: z.array(z.enum(SYMPTOM_IDS as never)).min(1).max(SYMPTOM_IDS.length),
    environment: environmentSchema.default({}),
    notes: z.string().max(500).optional(),
    /** when true the route refuses the fallback path and surfaces model errors */
    strictModel: z.boolean().default(false),
  })
  .strict()

export const communityReportCreateSchema = z
  .object({
    regionId: z.enum(REGIONS.map((r) => r.id) as never),
    cropId: z.enum(CROPS as never),
    symptomId: z.enum(SYMPTOM_IDS as never),
    observedOn: isoDate,
    notes: z.string().max(500).optional(),
  })
  .strict()

export const treatmentCompareSchema = z
  .object({
    cropId: z.enum(CROPS as never).optional(),
    conditionId: z.string().max(60).optional(),
    budget: z.coerce.number().min(0).max(1_000_000),
    optionIds: z.array(z.string().max(60)).max(40).optional(),
  })
  .strict()

export const assistantMessageSchema = z
  .object({
    message: z.string().trim().min(1).max(600),
    conversationId: z.string().max(64).optional(),
    cropId: z.enum(CROPS as never).optional(),
    regionId: z.enum(REGIONS.map((r) => r.id) as never).optional(),
    budget: z.coerce.number().min(0).max(1_000_000).optional(),
  })
  .strict()

export const fieldCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    cropId: z.enum(CROPS as never),
    variety: z.string().trim().max(80).optional(),
    areaValue: z.coerce.number().min(0).max(10_000),
    areaUnit: z.enum(['acre', 'hectare'] as never),
    plantedOn: isoDate,
    notes: z.string().max(500).optional(),
    soil: z.string().max(120).optional(),
    irrigation: z.string().max(120).optional(),
  })
  .strict()

export const fieldObservationSchema = z
  .object({
    observedOn: isoDate,
    note: z.string().trim().min(1).max(500),
    mood: z.enum(OBSERVATION_MOODS as never),
  })
  .strict()

export const fieldPatchSchema = fieldCreateSchema.partial()

export const notificationPatchSchema = z.object({ read: z.boolean() }).strict()

const idChars = /^[a-zA-Z0-9-]{1,64}$/
export const mongoIdSchema = z.string().regex(idChars, 'Malformed identifier')

export const treatmentListQuerySchema = z
  .object({
    conditionId: z.string().max(60).optional(),
  })
  .partial()

export const listQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
    skip: z.coerce.number().int().min(0).max(10_000).default(0),
  })
  .partial()

import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('family-english-api'),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>

export const readinessResponseSchema = z.object({
  status: z.literal('ready'),
  service: z.literal('family-english-api'),
  dependencies: z.object({ database: z.literal('connected') }),
})

export type ReadinessResponse = z.infer<typeof readinessResponseSchema>

export const parentLoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type ParentLoginRequest = z.infer<typeof parentLoginRequestSchema>

export const parentSessionResponseSchema = z.object({
  parent: z.object({
    email: z.string().email(),
  }),
  mode: z.enum(['parent', 'learner']).default('parent'),
})

export type ParentSessionResponse = z.infer<typeof parentSessionResponseSchema>

export const authenticationErrorSchema = z.object({
  message: z.string(),
})

export type AuthenticationError = z.infer<typeof authenticationErrorSchema>

export const learnerAvatarIds = ['fox', 'panda', 'dolphin'] as const

export const createLearnerRequestSchema = z.object({
  nickname: z.string().trim().min(1).max(24),
  avatarId: z.enum(learnerAvatarIds),
  pin: z.string().regex(/^\d{6}$/),
})

export type CreateLearnerRequest = z.infer<typeof createLearnerRequestSchema>

export const learnerProfileSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  avatarId: z.enum(learnerAvatarIds),
})

export type LearnerProfile = z.infer<typeof learnerProfileSchema>

export const switchToLearnerRequestSchema = z.object({
  pin: z.string().regex(/^\d{6}$/),
})

export const returnToParentRequestSchema = z.object({
  password: z.string().min(1),
})

export const updateLearnerRequestSchema = z.object({
  nickname: z.string().trim().min(1).max(24),
  avatarId: z.enum(learnerAvatarIds),
})

export const updateLearnerPinRequestSchema = z.object({
  password: z.string().min(1),
  pin: z.string().regex(/^\d{6}$/),
})

export type UpdateLearnerRequest = z.infer<typeof updateLearnerRequestSchema>

export const parentPasswordRequestSchema = z.object({ password: z.string().min(1) })
export const confirmLearnerDeletionRequestSchema = z.object({
  password: z.string().min(1),
  confirmationToken: z.string().min(1),
  confirm: z.literal(true),
})
export const learnerDeletionPreviewSchema = z.object({
  learnerId: z.string(),
  nickname: z.string(),
  impact: z.object({ teachingSessions: z.number().int().nonnegative(), observations: z.number().int().nonnegative() }),
  confirmationToken: z.string(),
  expiresAt: z.string().datetime(),
})
export const familyDataExportSchema = z.object({
  exportedAt: z.string().datetime(),
  learner: learnerProfileSchema,
  adaptation: z.record(z.string(), z.unknown()).nullable(),
  teachingSessions: z.array(z.record(z.string(), z.unknown())),
  observations: z.array(z.record(z.string(), z.unknown())),
  summary: z.string(),
})


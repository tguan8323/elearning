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

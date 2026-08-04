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

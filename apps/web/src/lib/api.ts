import type { HealthResponse, LearnerProfile, ParentSessionResponse } from '@family-english/contracts'
import { healthResponseSchema, learnerProfileSchema, parentSessionResponseSchema } from '@family-english/contracts'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api'

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${API_URL}/health`, { cache: 'no-store' })
    if (!response.ok) return null
    return healthResponseSchema.parse(await response.json())
  } catch {
    return null
  }
}

export async function getCurrentLearner(): Promise<LearnerProfile | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/learners/current`, {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    if (!response.ok) return null
    return learnerProfileSchema.parse(await response.json())
  } catch {
    return null
  }
}

export async function getCurrentParent(): Promise<ParentSessionResponse | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/auth/me`, {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    if (!response.ok) return null
    return parentSessionResponseSchema.parse(await response.json())
  } catch {
    return null
  }
}

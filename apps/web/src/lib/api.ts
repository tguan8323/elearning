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

export async function getSessionMode(): Promise<'parent' | 'learner' | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/auth/session`, {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    if (!response.ok) return null
    const body = await response.json() as { mode?: unknown }
    return body.mode === 'parent' || body.mode === 'learner' ? body.mode : null
  } catch {
    return null
  }
}

export async function getLearnerHome(): Promise<LearnerProfile | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/learner-home`, {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    if (!response.ok) return null
    return learnerProfileSchema.parse(await response.json())
  } catch {
    return null
  }
}

export type EvidenceSummary = {
  stableTargetIds: string[]
  reviewQueue: Array<{ id: string; title: string; reason: string }>
  trendSummary: string
}

export async function getEvidenceSummary(): Promise<EvidenceSummary | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/learning/evidence-summary`, {
      cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    return response.ok ? await response.json() as EvidenceSummary : null
  } catch { return null }
}

export async function getLearningPlan(): Promise<{
  target: { id: string; title: string; parentScript: string[]; materials: string[] }
  review: Array<{ id: string; title: string }>
  upcoming: Array<{ id: string; title: string }>
} | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/learning/plan`, {
      cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    return response.ok ? await response.json() as Awaited<ReturnType<typeof getLearningPlan>> : null
  } catch { return null }
}

export async function getPracticeTargets(): Promise<Array<{ id: string; title: string }>> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/learning/practice`, {
      cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    return response.ok ? await response.json() as Array<{ id: string; title: string }> : []
  } catch { return [] }
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

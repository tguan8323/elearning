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

export type FamilyAdaptation = {
  sessionMinutes: number
  sessionsPerWeek: number
  accent: 'en-US'
  reducedMotion: boolean
  soundEnabled: boolean
  interests: string[]
  excludedThemes: string[]
  availableMaterials: string[]
}

export type MaterialsCatalogItem = { id: string; title: string; kind: string; description: string; fields: string[] }

async function getLearningResource<T>(path: string): Promise<T | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/learning/${path}`, { cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : {} })
    return response.ok ? await response.json() as T : null
  } catch { return null }
}

export function getFamilyAdaptation() { return getLearningResource<FamilyAdaptation>('adaptation') }
export async function getMaterialsCatalog() { return (await getLearningResource<MaterialsCatalogItem[]>('materials-catalog')) ?? [] }

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

export type PracticeTarget = {
  id: string
  title: string
  prompt: string
  choices: string[]
}

export async function getPracticeTargets(): Promise<PracticeTarget[]> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}/learning/practice`, {
      cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    return response.ok ? await response.json() as PracticeTarget[] : []
  } catch { return [] }
}

export type FamilyContentItem = {
  id: string
  title: string
  contentType: string
  language: string
  source: string
  rightsNote: string
  description?: string
  status: 'draft' | 'cataloged' | 'bound' | 'published' | 'withdrawn'
}

async function getFamilyContent(path: string): Promise<FamilyContentItem[]> {
  try {
    const cookieHeader = (await cookies()).toString()
    const response = await fetch(`${API_URL}${path}`, {
      cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
    if (!response.ok) return []
    const body = await response.json() as unknown
    if (!Array.isArray(body)) return []
    return body.filter((item): item is FamilyContentItem => {
      if (!item || typeof item !== 'object') return false
      const value = item as Record<string, unknown>
      return typeof value.id === 'string' && typeof value.title === 'string' &&
        typeof value.contentType === 'string' && typeof value.language === 'string' &&
        typeof value.source === 'string' && typeof value.rightsNote === 'string' &&
        ['draft', 'cataloged', 'bound', 'published', 'withdrawn'].includes(String(value.status))
    })
  } catch { return [] }
}

export function getFamilyContentCatalog() {
  return getFamilyContent('/family-content')
}

export function getPublishedFamilyContent() {
  return getFamilyContent('/learner-home/family-content?status=published')
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

import type { HealthResponse } from '@family-english/contracts'
import { healthResponseSchema } from '@family-english/contracts'

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

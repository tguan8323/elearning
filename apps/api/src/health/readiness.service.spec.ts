import { describe, expect, it, vi } from 'vitest'

import type { PrismaService } from '../database/prisma.service'
import { ReadinessService } from './readiness.service'

describe('ReadinessService', () => {
  it('reports the database connection after a successful query', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }])
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService
    const service = new ReadinessService(prisma)

    await expect(service.check()).resolves.toEqual({
      status: 'ready',
      service: 'family-english-api',
      dependencies: { database: 'connected' },
    })
    expect(queryRaw).toHaveBeenCalledOnce()
  })
})

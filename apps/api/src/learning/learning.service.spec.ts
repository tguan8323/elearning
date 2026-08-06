import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../database/prisma.service'
import { LearningService } from './learning.service'

function mockPrisma() {
  return {
    learnerProfile: { findUnique: vi.fn() },
    teachingSession: { findFirst: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    learningObservation: { findMany: vi.fn(), upsert: vi.fn() },
    familyAdaptation: { upsert: vi.fn(), update: vi.fn() },
  }
}

describe('LearningService evidence slice', () => {
  let prisma: ReturnType<typeof mockPrisma>
  let service: LearningService
  beforeEach(() => {
    prisma = mockPrisma()
    prisma.learnerProfile.findUnique.mockResolvedValue({ id: 'learner-1' })
    service = new LearningService(prisma as unknown as PrismaService)
  })

  it('strictly rejects an observation outside its owned session or vocabulary', async () => {
    prisma.teachingSession.findFirst.mockResolvedValue(null)
    await expect(service.observe('parent-1', {
      clientId: 'obs-1', sessionId: 'other-session', targetId: 'phonics-s', outcome: 'independent', promptLevel: 'none', materialVariant: 'cards',
    })).rejects.toMatchObject({ status: 400 })
    expect(prisma.learningObservation.upsert).not.toHaveBeenCalled()
  })

  it('requires prompt level and a material or activity variant', async () => {
    prisma.teachingSession.findFirst.mockResolvedValue({ id: 'session-1', targetId: 'phonics-s' })
    await expect(service.observe('parent-1', {
      clientId: 'obs-1', sessionId: 'session-1', targetId: 'phonics-s', outcome: 'prompted',
    })).rejects.toMatchObject({ status: 400 })
  })

  it('builds stable retention only across days with independent evidence and variation', async () => {
    prisma.learningObservation.findMany.mockResolvedValue([
      { targetId: 'phonics-s', outcome: 'prompted', promptLevel: 'gesture', materialVariant: 'cards', observedAt: new Date('2026-08-01') },
      { targetId: 'phonics-s', outcome: 'independent', promptLevel: 'none', materialVariant: 'objects', observedAt: new Date('2026-08-03') },
      { targetId: 'phonics-a', outcome: 'not_yet', promptLevel: 'direct_model', materialVariant: 'cards', observedAt: new Date('2026-08-03') },
    ])
    const result = await service.getEvidenceSummary('parent-1')
    expect(result.stableTargetIds).toEqual(['phonics-s'])
    expect(result.reviewQueue[0]?.id).toBe('phonics-a')
    expect(result.reviewQueue[0]?.reason).toContain('回顾')
    expect(result.trendSummary).toContain('提示')
    expect(result.trendSummary).not.toMatch(/%|正确率|总分/)
  })
})

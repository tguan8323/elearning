/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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

describe('LearningService evidence and practice', () => {
  let prisma: ReturnType<typeof mockPrisma>
  let service: LearningService

  beforeEach(() => {
    prisma = mockPrisma()
    prisma.learnerProfile.findUnique.mockResolvedValue({ id: 'learner-1' })
    service = new LearningService(prisma as unknown as PrismaService)
  })

  it('creates and resets the documented family defaults', async () => {
    prisma.familyAdaptation.upsert.mockResolvedValue({ sessionMinutes: 15, sessionsPerWeek: 5, accent: 'en-US' })
    await service.getAdaptation('parent-1')
    const firstCreate = prisma.familyAdaptation.upsert.mock.calls[0]?.[0].create
    expect(firstCreate).toMatchObject({ parentId: 'parent-1', sessionMinutes: 15, sessionsPerWeek: 5, accent: 'en-US', reducedMotion: true })
    await service.resetAdaptation('parent-1')
    const resetUpdate = prisma.familyAdaptation.upsert.mock.calls.at(-1)?.[0].update
    expect(resetUpdate).toMatchObject({ sessionMinutes: 15, sessionsPerWeek: 5, accent: 'en-US' })
  })

  it('normalizes adaptation lists and exposes metadata-only protected-material navigation', async () => {
    prisma.familyAdaptation.upsert.mockResolvedValue({})
    prisma.familyAdaptation.update.mockResolvedValue({})
    await service.updateAdaptation('parent-1', {
      sessionMinutes: 20, sessionsPerWeek: 4, accent: 'en-US', reducedMotion: false, soundEnabled: false,
      interests: [' space ', 'space', ''], excludedThemes: ['竞赛'], availableMaterials: ['Flash Cards'],
    })
    expect(prisma.familyAdaptation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accent: 'en-US', interests: ['space'] }),
    }))
    const catalog = service.getMaterialsCatalog()
    expect(catalog.map((item) => item.id)).toEqual(['flash-cards', 'ort-physical-books'])
    expect(JSON.stringify(catalog)).toContain('不存储或复制')
    expect(JSON.stringify(catalog)).not.toMatch(/故事正文|书页内容/)
  })

  it('returns only curriculum targets observed in completed accompanied sessions', async () => {
    prisma.learningObservation.findMany.mockResolvedValue([
      { targetId: 'functional-help' },
      { targetId: 'not-in-curriculum' },
    ])

    await expect(service.getPractice('parent-1')).resolves.toEqual([
      expect.objectContaining({ id: 'functional-help', prompt: 'What do you need?' }),
    ])
    expect(prisma.learningObservation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { learnerId: 'learner-1', session: { status: 'COMPLETED' } },
    }))
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

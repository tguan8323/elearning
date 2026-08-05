import { Prisma } from '@prisma/client'
import { verify } from 'argon2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaService } from '../database/prisma.service'
import { LearnersService } from './learners.service'

function createPrismaMock() {
  return {
    learnerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  }
}

describe('LearnersService', () => {
  let prisma: ReturnType<typeof createPrismaMock>
  let service: LearnersService

  beforeEach(() => {
    prisma = createPrismaMock()
    service = new LearnersService(prisma as unknown as PrismaService)
  })

  it('creates the only learner with a trimmed nickname and hashed PIN', async () => {
    prisma.learnerProfile.findUnique.mockResolvedValue(null)
    prisma.learnerProfile.create.mockResolvedValue({
      id: 'learner-1',
      nickname: '小星',
      avatarId: 'fox',
    })

    const learner = await service.create('parent-1', {
      nickname: ' 小星 ',
      avatarId: 'fox',
      pin: '123456',
    })

    const input = prisma.learnerProfile.create.mock.calls[0]?.[0] as {
      data: { parentId: string; nickname: string; avatarId: string; pinHash: string }
      select: Record<string, boolean>
    }
    expect(input.data).toMatchObject({ parentId: 'parent-1', nickname: '小星', avatarId: 'fox' })
    expect(input.data.pinHash).not.toContain('123456')
    await expect(verify(input.data.pinHash, '123456')).resolves.toBe(true)
    expect(input.select).toEqual({ id: true, nickname: true, avatarId: true })
    expect(learner).toEqual({ id: 'learner-1', nickname: '小星', avatarId: 'fox' })
    expect(learner).not.toHaveProperty('pin')
    expect(learner).not.toHaveProperty('pinHash')
  })

  it('rejects an existing learner before hashing and creating', async () => {
    prisma.learnerProfile.findUnique.mockResolvedValue({ id: 'learner-1' })

    await expect(
      service.create('parent-1', { nickname: '小星', avatarId: 'fox', pin: '123456' }),
    ).rejects.toMatchObject({ status: 409 })
    expect(prisma.learnerProfile.create).not.toHaveBeenCalled()
  })

  it('converts a concurrent unique constraint conflict to 409', async () => {
    prisma.learnerProfile.findUnique.mockResolvedValue(null)
    prisma.learnerProfile.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate learner', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    )

    await expect(
      service.create('parent-1', { nickname: '小星', avatarId: 'fox', pin: '123456' }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('returns the current learner without its PIN hash', async () => {
    prisma.learnerProfile.findUnique.mockResolvedValue({
      id: 'learner-1',
      nickname: '小星',
      avatarId: 'fox',
    })

    await expect(service.getCurrent('parent-1')).resolves.toEqual({
      id: 'learner-1',
      nickname: '小星',
      avatarId: 'fox',
    })
  })

  it('returns 404 when no learner exists', async () => {
    prisma.learnerProfile.findUnique.mockResolvedValue(null)
    await expect(service.getCurrent('parent-1')).rejects.toMatchObject({ status: 404 })
  })
})

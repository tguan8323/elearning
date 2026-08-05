import { hash } from 'argon2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaService } from '../database/prisma.service'
import { AuthService } from './auth.service'

function createPrismaMock() {
  return {
    parentAccount: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    parentSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  }
}

describe('AuthService', () => {
  let prisma: ReturnType<typeof createPrismaMock>
  let service: AuthService

  beforeEach(() => {
    prisma = createPrismaMock()
    service = new AuthService(prisma as unknown as PrismaService)
  })

  it('initializes one parent with normalized email and a password hash', async () => {
    prisma.parentAccount.findFirst.mockResolvedValue(null)
    prisma.parentAccount.create.mockResolvedValue({ id: 'parent-1' })

    await expect(service.initializeParent(' Parent@Example.com ', 'a-secure-password')).resolves.toEqual({ created: true })
    const createInput = prisma.parentAccount.create.mock.calls[0]?.[0] as {
      data: { email: string; passwordHash: string }
    }
    expect(createInput.data.email).toBe('parent@example.com')
    expect(createInput.data.passwordHash).not.toContain('a-secure-password')
  })

  it('does not create a second parent', async () => {
    prisma.parentAccount.findFirst.mockResolvedValue({ id: 'parent-1' })

    await expect(service.initializeParent('other@example.com', 'a-secure-password')).resolves.toEqual({ created: false })
    expect(prisma.parentAccount.create).not.toHaveBeenCalled()
  })

  it('returns the same error for a missing account and a wrong password', async () => {
    prisma.parentAccount.findUnique.mockResolvedValueOnce(null)
    await expect(service.login('missing@example.com', 'wrong')).rejects.toMatchObject({ message: '邮箱或密码不正确' })

    prisma.parentAccount.findUnique.mockResolvedValueOnce({
      id: 'parent-1',
      email: 'parent@example.com',
      passwordHash: await hash('correct-password'),
    })
    await expect(service.login('parent@example.com', 'wrong')).rejects.toMatchObject({ message: '邮箱或密码不正确' })
  })

  it('rejects an idle session before updating its activity time', async () => {
    prisma.parentSession.findUnique.mockResolvedValue({
      id: 'session-1',
      mode: 'PARENT',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000 - 1),
      parent: { id: 'parent-1', email: 'parent@example.com' },
    })

    await expect(service.getParentForToken('token')).resolves.toBeNull()
    expect(prisma.parentSession.update).not.toHaveBeenCalled()
  })

  it('returns mode and refreshes activity for an active session', async () => {
    prisma.parentSession.findUnique.mockResolvedValue({
      id: 'session-1',
      mode: 'LEARNER',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      lastSeenAt: new Date(),
      parent: { id: 'parent-1', email: 'parent@example.com' },
    })
    prisma.parentSession.update.mockResolvedValue({ id: 'session-1' })

    await expect(service.getParentForToken('token')).resolves.toMatchObject({
      id: 'parent-1', sessionId: 'session-1', mode: 'LEARNER',
    })
    expect(prisma.parentSession.update).toHaveBeenCalled()
  })

  it('creates and revokes a hashed session token', async () => {
    prisma.parentAccount.findUnique.mockResolvedValue({
      id: 'parent-1',
      email: 'parent@example.com',
      passwordHash: await hash('correct-password'),
    })
    prisma.parentSession.create.mockResolvedValue({ id: 'session-1' })
    prisma.parentSession.updateMany.mockResolvedValue({ count: 1 })

    const session = await service.login('parent@example.com', 'correct-password')
    const createSessionInput = prisma.parentSession.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string }
    }
    const storedHash = createSessionInput.data.tokenHash
    expect(storedHash).not.toBe(session.token)

    await service.logout(session.token)
    const logoutInput = prisma.parentSession.updateMany.mock.calls[0]?.[0] as {
      where: { tokenHash: string }
    }
    expect(logoutInput.where.tokenHash).toBe(storedHash)
  })
})

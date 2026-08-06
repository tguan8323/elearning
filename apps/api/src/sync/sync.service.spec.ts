/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { ConflictException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { SyncService } from './sync.service'

function prismaMock() {
  const tx = {
    syncOperation: { findUnique: vi.fn(), create: vi.fn() },
    syncChange: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    learnerProfile: { findUnique: vi.fn() },
    teachingSession: { upsert: vi.fn(), deleteMany: vi.fn() },
  }
  return { tx, prisma: { ...tx, $transaction: vi.fn((work) => work(tx)) } }
}

describe('SyncService', () => {
  it('returns a stable SHA-256 package checksum', () => {
    const { prisma } = prismaMock()
    const service = new SyncService(prisma as never)
    expect(service.packageChecksum({ lessons: ['s'] })).toBe('57ef021b97e548b332fb0bd342775269b02b5e31625be6544b8bb443ec99eb4b')
  })

  it('returns ledger result without applying an operation twice', async () => {
    const { tx, prisma } = prismaMock()
    tx.syncOperation.findUnique.mockResolvedValue({ result: { recordId: 'r1', version: 1, cursor: '4' } })
    const service = new SyncService(prisma as never)
    await expect(service.replay('p1', { operationId: 'op1', kind: 'delete-session', recordId: 'r1', baseVersion: 0 })).resolves.toEqual({ recordId: 'r1', version: 1, cursor: '4' })
    expect(tx.teachingSession.deleteMany).not.toHaveBeenCalled()
  })

  it('responds with current version when base version is stale', async () => {
    const { tx, prisma } = prismaMock()
    tx.syncOperation.findUnique.mockResolvedValue(null)
    tx.syncChange.findFirst.mockResolvedValue({ version: 3, deleted: true })
    const service = new SyncService(prisma as never)
    await expect(service.replay('p1', { operationId: 'op2', kind: 'delete-session', recordId: 'r1', baseVersion: 1 })).rejects.toBeInstanceOf(ConflictException)
  })
})

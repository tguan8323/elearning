import { Prisma } from '@prisma/client'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'

import { PrismaService } from '../database/prisma.service'

type SyncOperation = {
  operationId: string
  kind: 'upsert-session' | 'upsert-observation' | 'delete-session'
  recordId: string
  baseVersion: number
  payload?: { clientId: string; targetId: string; targetTitle?: string; sessionId?: string; outcome?: string; promptLevel?: string; materialVariant?: string; status?: string; startedAt?: string }
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async packageManifest(parentId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    if (!learner) throw new BadRequestException('尚未建立孩子学习身份')
    const publications = await this.prisma.publication.findMany({ where: { parentId, state: 'PUBLISHED', binding: { slot: { learnerEligible: true } } }, select: { id: true, versionId: true, snapshot: true } })
    const resources = publications.map((publication) => `/api/learner/family-content/${publication.id}/media`)
    const identity = { curriculumVersion: '2026.08-original-v1', publications: publications.map(({ id, versionId }) => ({ id, versionId })) }
    const payload = { curriculumVersion: identity.curriculumVersion, learnerId: learner.id, contents: ['core-curriculum', 'published-family-content'], resources, publications, sensitiveData: false }
    const checksum = this.packageChecksum(payload)
    return { version: this.packageChecksum(identity).slice(0, 16), checksum, sizeBytes: Buffer.byteLength(JSON.stringify(payload)), payload }
  }

  async packageBundle(parentId: string) {
    const manifest = await this.packageManifest(parentId)
    const body = Buffer.from(JSON.stringify(manifest.payload))
    return { ...manifest, body, capacity: { requiredBytes: body.length, recommendedBytes: body.length * 2, maxBytes: 50 * 1024 * 1024 }, retentionDays: 30 }
  }
  packageChecksum(body: unknown) {
    return createHash('sha256').update(JSON.stringify(body)).digest('hex')
  }

  async replay(parentId: string, operation: SyncOperation) {
    if (!operation.operationId?.trim() || !operation.recordId?.trim() || !Number.isInteger(operation.baseVersion)) {
      throw new BadRequestException('离线操作格式无效')
    }
    return this.prisma.$transaction(async (tx) => {
      const prior = await tx.syncOperation.findUnique({
        where: { parentId_operationId: { parentId, operationId: operation.operationId } },
      })
      if (prior) return prior.result

      const latest = await tx.syncChange.findFirst({
        where: { parentId, recordType: 'teaching-session', recordId: operation.recordId },
        orderBy: { version: 'desc' },
      })
      const currentVersion = latest?.version ?? 0
      if (operation.baseVersion !== currentVersion) {
        throw new ConflictException({ code: 'BASE_VERSION_CONFLICT', operationId: operation.operationId, recordId: operation.recordId, currentVersion, serverRecord: latest })
      }

      const learner = await tx.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
      if (!learner) throw new BadRequestException('尚未建立孩子学习身份')
      const version = currentVersion + 1
      let result: Record<string, unknown>
      if (operation.kind === 'delete-session') {
        await tx.teachingSession.deleteMany({ where: { id: operation.recordId, learnerId: learner.id } })
        result = { recordId: operation.recordId, version, deleted: true }
      } else if (operation.kind === 'upsert-session' && operation.payload) {
        if (latest?.deleted) throw new ConflictException({ code: 'TOMBSTONE_CONFLICT', currentVersion })
        const record = await tx.teachingSession.upsert({
          where: { clientId: operation.payload.clientId },
          update: { status: operation.payload.status ?? 'IN_PROGRESS' },
          create: {
            id: operation.recordId, clientId: operation.payload.clientId, learnerId: learner.id,
            targetId: operation.payload.targetId, targetTitle: operation.payload.targetTitle ?? operation.payload.targetId,
            status: operation.payload.status ?? 'IN_PROGRESS',
            startedAt: operation.payload.startedAt ? new Date(operation.payload.startedAt) : new Date(),
          },
        })
        result = { record, version, deleted: false }
      } else if (operation.kind === 'upsert-observation' && operation.payload) {
        const observation = await tx.learningObservation.upsert({
          where: { clientId: operation.payload.clientId }, update: {},
          create: { clientId: operation.payload.clientId, learnerId: learner.id, sessionId: operation.payload.sessionId ?? operation.recordId, targetId: operation.payload.targetId, outcome: operation.payload.outcome ?? 'not_observed', promptLevel: operation.payload.promptLevel ?? 'not_applicable', materialVariant: operation.payload.materialVariant ?? 'offline' },
        })
        result = { observation, version, deleted: false }
      } else throw new BadRequestException('不支持的离线操作')

      const jsonResult = result as Prisma.InputJsonObject
      const change = await tx.syncChange.create({
        data: { parentId, recordType: operation.kind === 'upsert-observation' ? 'learning-observation' : 'teaching-session', recordId: operation.recordId, version, deleted: operation.kind === 'delete-session', payload: jsonResult },
      })
      const response = { ...result, cursor: change.sequence.toString() }
      await tx.syncOperation.create({ data: { parentId, operationId: operation.operationId, result: response } })
      return response
    })
  }

  async pull(parentId: string, cursor = '0') {
    let sequence: bigint
    try { sequence = BigInt(cursor) } catch { throw new BadRequestException('同步游标无效') }
    const changes = await this.prisma.syncChange.findMany({
      where: { parentId, sequence: { gt: sequence } }, orderBy: { sequence: 'asc' }, take: 200,
    })
    return {
      changes: changes.map(({ sequence: value, ...change }) => ({ ...change, sequence: value.toString() })),
      cursor: changes.at(-1)?.sequence.toString() ?? cursor,
    }
  }
}

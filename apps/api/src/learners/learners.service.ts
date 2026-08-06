import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { createHash, randomBytes } from 'node:crypto'
import { hash, verify } from 'argon2'

import { PrismaService } from '../database/prisma.service'

@Injectable()
export class LearnersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getCurrent(parentId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { parentId },
      select: { id: true, nickname: true, avatarId: true },
    })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    return learner
  }

  async verifyPin(parentId: string, pin: string) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { parentId },
      select: { pinHash: true },
    })
    return learner ? verify(learner.pinHash, pin) : false
  }

  async update(parentId: string, input: { nickname: string; avatarId: string }) {
    return this.prisma.learnerProfile.update({
      where: { parentId },
      data: { nickname: input.nickname.trim(), avatarId: input.avatarId },
      select: { id: true, nickname: true, avatarId: true },
    })
  }

  async updatePin(parentId: string, pin: string) {
    await this.prisma.learnerProfile.update({
      where: { parentId },
      data: { pinHash: await hash(pin, { type: 2 }) },
    })
    return { success: true }
  }

  async create(parentId: string, input: { nickname: string; avatarId: string; pin: string }) {
    const existing = await this.prisma.learnerProfile.findUnique({
      where: { parentId },
      select: { id: true },
    })
    if (existing) throw new ConflictException('孩子学习身份已经建立')

    const pinHash = await hash(input.pin, { type: 2 })
    try {
      return await this.prisma.learnerProfile.create({
        data: {
          parentId,
          nickname: input.nickname.trim(),
          avatarId: input.avatarId,
          pinHash,
        },
        select: { id: true, nickname: true, avatarId: true },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('孩子学习身份已经建立')
      }
      throw error
    }
  }

  async exportData(parentId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { parentId },
      select: {
        id: true, nickname: true, avatarId: true, createdAt: true, updatedAt: true,
        sessions: { orderBy: { createdAt: 'asc' } },
        observations: { orderBy: { observedAt: 'asc' } },
      },
    })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    const adaptation = await this.prisma.familyAdaptation.findUnique({ where: { parentId } })
    const { sessions, observations, ...profile } = learner
    return {
      exportedAt: new Date().toISOString(),
      learner: profile,
      adaptation,
      teachingSessions: sessions,
      observations,
      summary: `孩子 ${learner.nickname}：共 ${sessions.length} 条教学记录、${observations.length} 条学习观察。`,
    }
  }

  async previewDeletion(parentId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { parentId },
      select: { id: true, nickname: true, _count: { select: { sessions: true, observations: true } } },
    })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + 10 * 60_000)
    await this.prisma.$transaction([
      this.prisma.learnerDeletionIntent.deleteMany({ where: { parentId } }),
      this.prisma.learnerDeletionIntent.create({
        data: { parentId, learnerId: learner.id, tokenHash: this.hashToken(token), expiresAt },
      }),
    ])
    return {
      learnerId: learner.id,
      nickname: learner.nickname,
      impact: { teachingSessions: learner._count.sessions, observations: learner._count.observations },
      confirmationToken: token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  async confirmDeletion(parentId: string, confirmationToken: string) {
    const tokenHash = this.hashToken(confirmationToken)
    return this.prisma.$transaction(async (tx) => {
      const intent = await tx.learnerDeletionIntent.findUnique({ where: { tokenHash } })
      if (!intent || intent.parentId !== parentId || intent.expiresAt <= new Date()) {
        throw new ForbiddenException('删除确认已失效，请重新预览影响')
      }
      const learner = await tx.learnerProfile.findFirst({
        where: { id: intent.learnerId, parentId },
        select: { id: true, nickname: true, _count: { select: { sessions: true, observations: true } } },
      })
      if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
      const deletedAt = new Date()
      const tombstone = await tx.learnerDeletionTombstone.create({
        data: {
          parentId, deletedLearnerId: learner.id,
          teachingSessionCount: learner._count.sessions, observationCount: learner._count.observations, deletedAt,
        },
        select: { id: true, deletedLearnerId: true, deletedAt: true },
      })
      await tx.learnerProfile.delete({ where: { id: learner.id, parentId } })
      await tx.parentSession.updateMany({ where: { parentId, mode: 'LEARNER' }, data: { mode: 'PARENT' } })
      await tx.learnerDeletionIntent.deleteMany({ where: { parentId } })
      return { deleted: true, childModeDisabled: true, tombstone }
    })
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }
}

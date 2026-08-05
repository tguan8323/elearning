import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
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
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { curriculumTargets } from './curriculum.data'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class LearningService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getPractice(parentId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    const evidence = await this.prisma.learningObservation.findMany({
      where: { learnerId: learner.id }, select: { targetId: true }, distinct: ['targetId'],
    })
    return evidence
      .map((item) => curriculumTargets.find((target) => target.id === item.targetId))
      .filter((item) => item !== undefined)
      .map((item) => ({ id: item.id, title: item.title }))
  }

  async getAdaptation(parentId: string) {
    return this.prisma.familyAdaptation.upsert({
      where: { parentId },
      update: {},
      create: {
        parentId,
        interests: [],
        excludedThemes: ['强烈声音', '闪烁动画', '竞争与倒计时'],
        availableMaterials: ['Flash Cards', 'ORT 实体书'],
      },
    })
  }

  async updateAdaptation(parentId: string, input: Record<string, unknown>) {
    await this.getAdaptation(parentId)
    return this.prisma.familyAdaptation.update({ where: { parentId }, data: input })
  }

  async getPlan(parentId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    const observations = await this.prisma.learningObservation.findMany({
      where: { learnerId: learner.id }, orderBy: { observedAt: 'desc' }, take: 50,
    })
    const introduced = new Set(observations.map((item) => item.targetId))
    const target = curriculumTargets.find((item) =>
      !introduced.has(item.id) && item.prerequisiteIds.every((id) => introduced.has(id)),
    ) ?? curriculumTargets[0]
    const review = observations
      .filter((item) => item.outcome !== 'independent')
      .slice(0, 3)
      .map((item) => curriculumTargets.find((targetItem) => targetItem.id === item.targetId))
      .filter((item) => item !== undefined)
    return { target, review, upcoming: curriculumTargets.filter((item) => !introduced.has(item.id)).slice(0, 5) }
  }

  async startSession(parentId: string, clientId: string, targetId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    const target = curriculumTargets.find((item) => item.id === targetId)
    if (!learner || !target) throw new NotFoundException('教学目标不存在')
    return this.prisma.teachingSession.upsert({
      where: { clientId }, update: {},
      create: { clientId, learnerId: learner.id, targetId, targetTitle: target.title, status: 'IN_PROGRESS', startedAt: new Date() },
    })
  }

  async observe(parentId: string, input: { clientId: string; sessionId: string; targetId: string; outcome: string; promptLevel?: string; materialVariant?: string; note?: string }) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    return this.prisma.learningObservation.upsert({
      where: { clientId: input.clientId }, update: {},
      create: { ...input, learnerId: learner.id },
    })
  }

  async finishSession(parentId: string, sessionId: string, status: string) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    return this.prisma.teachingSession.update({
      where: { id: sessionId, learnerId: learner.id }, data: { status, endedAt: new Date() },
    })
  }
}

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { curriculumTargets, curriculumVersion, phonicsGroupCount } from './curriculum.data'
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
    return {
      curriculumVersion,
      phonicsGroupCount,
      target,
      reason: review.length > 0
        ? '先保留少量回顾，再引入一个满足前置条件的新目标。'
        : '这是当前满足前置条件的下一个新目标。',
      review,
      upcoming: curriculumTargets.filter((item) => !introduced.has(item.id)).slice(0, 5),
    }
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
    const outcomes = ['independent', 'prompted', 'not_yet', 'refused']
    const promptLevels = ['none', 'visual', 'gesture', 'verbal', 'direct_model']
    const session = await this.prisma.teachingSession.findFirst({
      where: { id: input.sessionId, learnerId: learner.id }, select: { id: true, targetId: true },
    })
    if (!session || session.targetId !== input.targetId || !curriculumTargets.some((target) => target.id === input.targetId)) {
      throw new BadRequestException('观察记录必须属于当前孩子的匹配教学时段')
    }
    if (!outcomes.includes(input.outcome) || !input.promptLevel || !promptLevels.includes(input.promptLevel)) {
      throw new BadRequestException('请选择有效的学习表现和提示层级')
    }
    if (input.outcome === 'independent' && input.promptLevel !== 'none') {
      throw new BadRequestException('独立完成不能包含提示')
    }
    if (input.outcome !== 'independent' && input.promptLevel === 'none') {
      throw new BadRequestException('非独立表现需要记录提示层级')
    }
    const variant = input.materialVariant?.trim()
    if (!variant || variant.length > 80 || (input.note?.length ?? 0) > 500 || input.clientId.trim().length === 0) {
      throw new BadRequestException('请记录材料或活动变化，并检查备注长度')
    }
    return this.prisma.learningObservation.upsert({
      where: { clientId: input.clientId.trim() }, update: {},
      create: { ...input, clientId: input.clientId.trim(), materialVariant: variant, learnerId: learner.id },
    })
  }

  async getEvidenceSummary(parentId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    const observations = await this.prisma.learningObservation.findMany({
      where: { learnerId: learner.id }, orderBy: { observedAt: 'desc' }, take: 200,
    })
    const groups = new Map<string, typeof observations>()
    for (const observation of observations) groups.set(observation.targetId, [...(groups.get(observation.targetId) ?? []), observation])
    const stableTargetIds: string[] = []
    const reviewQueue: Array<{ id: string; title: string; reason: string }> = []
    for (const [targetId, items] of groups) {
      const target = curriculumTargets.find((candidate) => candidate.id === targetId)
      if (!target) continue
      const days = new Set(items.map((item) => item.observedAt.toISOString().slice(0, 10)))
      const variants = new Set(items.map((item) => item.materialVariant).filter(Boolean))
      const stable = days.size >= 2 && variants.size >= 2 && items.some((item) => item.outcome === 'independent' && item.promptLevel === 'none')
      if (stable) stableTargetIds.push(targetId)
      else reviewQueue.push({ id: targetId, title: target.title, reason: items.some((item) => item.outcome === 'not_yet' || item.outcome === 'refused') ? '近期表现提示需要优先回顾' : '还需要跨教学日或更换活动继续观察' })
    }
    reviewQueue.sort((a, b) => {
      const difficult = (id: string) => groups.get(id)?.filter((item) => item.outcome === 'not_yet' || item.outcome === 'refused').length ?? 0
      return difficult(b.id) - difficult(a.id)
    })
    const recent = observations.slice(0, 10)
    const independent = recent.filter((item) => item.outcome === 'independent').length
    const prompted = recent.filter((item) => item.outcome === 'prompted').length
    const trendSummary = recent.length === 0
      ? '还没有学习表现记录，完成教学后会在这里形成文字回顾。'
      : independent > prompted
        ? '近期在多项活动中能独立回应；仍建议通过间隔和材料变化继续确认稳定保留。'
        : '近期较多活动仍需要提示；建议优先回顾队列中的内容，并逐步减轻提示。'
    return { stableTargetIds, reviewQueue: reviewQueue.slice(0, 5), trendSummary }
  }

  async finishSession(parentId: string, sessionId: string, status: string) {
    const learner = await this.prisma.learnerProfile.findUnique({ where: { parentId }, select: { id: true } })
    if (!learner) throw new NotFoundException('尚未建立孩子学习身份')
    return this.prisma.teachingSession.update({
      where: { id: sessionId, learnerId: learner.id }, data: { status, endedAt: new Date() },
    })
  }
}

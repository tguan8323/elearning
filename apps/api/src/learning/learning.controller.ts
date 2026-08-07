import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req } from '@nestjs/common'
import type { Request } from 'express'

import { ParentSessionService } from '../auth/parent-session.service'
import { UpdateFamilyAdaptationDto } from './adaptation.dto'
import { LearningService } from './learning.service'

@Controller('learning')
export class LearningController {
  constructor(
    @Inject(LearningService) private readonly learning: LearningService,
    @Inject(ParentSessionService) private readonly sessions: ParentSessionService,
  ) {}

  @Get('practice')
  async practice(@Req() request: Request) {
    const session = await this.sessions.requireLearner(request)
    return this.learning.getPractice(session.id)
  }

  @Get('adaptation')
  async adaptation(@Req() request: Request) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.getAdaptation(parent.id)
  }

  @Patch('adaptation')
  async updateAdaptation(@Req() request: Request, @Body() input: UpdateFamilyAdaptationDto) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.updateAdaptation(parent.id, input)
  }

  @Post('adaptation/reset')
  async resetAdaptation(@Req() request: Request) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.resetAdaptation(parent.id)
  }

  @Get('materials-catalog')
  async materialsCatalog(@Req() request: Request) {
    await this.sessions.requireParent(request)
    return this.learning.getMaterialsCatalog()
  }

  @Get('evidence-summary')
  async evidenceSummary(@Req() request: Request) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.getEvidenceSummary(parent.id)
  }

  @Get('course-map')
  async courseMap(@Req() request: Request) {
    await this.sessions.requireParent(request)
    return this.learning.getCourseMap()
  }

  @Get('plan')
  async plan(@Req() request: Request) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.getPlan(parent.id)
  }

  @Get('sessions')
  async sessionsList(@Req() request: Request) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.listSessions(parent.id)
  }

  @Patch('observations/:id/note')
  async updateObservationNote(@Req() request: Request, @Param('id') observationId: string, @Body() input: { note?: string }) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.updateObservationNote(parent.id, observationId, input.note)
  }

  @Post('sessions')
  async start(@Req() request: Request, @Body() input: { clientId: string; targetId: string }) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.startSession(parent.id, input.clientId, input.targetId)
  }

  @Post('observations')
  async observe(@Req() request: Request, @Body() input: Parameters<LearningService['observe']>[1]) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.observe(parent.id, input)
  }

  @Delete('sessions/:id')
  async deleteSession(@Req() request: Request, @Param('id') sessionId: string) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.deleteSession(parent.id, sessionId)
  }

  @Patch('sessions/:id')
  async finish(@Req() request: Request, @Param('id') sessionId: string, @Body() input: { status: string }) {
    const parent = await this.sessions.requireParent(request)
    return this.learning.finishSession(parent.id, sessionId, input.status)
  }
}

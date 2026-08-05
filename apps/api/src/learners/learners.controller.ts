import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common'
import type { Request } from 'express'

import { ParentSessionService } from '../auth/parent-session.service'
import { CreateLearnerPipe } from './create-learner.pipe'
import { LearnersService } from './learners.service'

@Controller('learners')
export class LearnersController {
  constructor(
    @Inject(LearnersService) private readonly learners: LearnersService,
    @Inject(ParentSessionService) private readonly parentSession: ParentSessionService,
  ) {}

  @Get('current')
  async getCurrent(@Req() request: Request) {
    const parent = await this.parentSession.requireParent(request)
    return this.learners.getCurrent(parent.id)
  }

  @Post()
  async create(
    @Req() request: Request,
    @Body(CreateLearnerPipe) input: Parameters<LearnersService['create']>[1],
  ) {
    const parent = await this.parentSession.requireParent(request)
    return this.learners.create(parent.id, input)
  }
}

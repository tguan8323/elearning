import { Controller, Get, Inject, Req } from '@nestjs/common'
import type { Request } from 'express'

import { ParentSessionService } from '../auth/parent-session.service'
import { LearnersService } from './learners.service'

@Controller('learner-home')
export class LearnerHomeController {
  constructor(
    @Inject(LearnersService) private readonly learners: LearnersService,
    @Inject(ParentSessionService) private readonly parentSession: ParentSessionService,
  ) {}

  @Get()
  async get(@Req() request: Request) {
    const session = await this.parentSession.requireLearner(request)
    return this.learners.getCurrent(session.id)
  }
}

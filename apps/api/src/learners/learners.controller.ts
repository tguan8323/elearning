import { Body, Controller, Get, Inject, Patch, Post, Req, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

import { AuthService } from '../auth/auth.service'
import { ParentSessionService } from '../auth/parent-session.service'
import { CreateLearnerPipe } from './create-learner.pipe'
import { UpdateLearnerPinPipe, UpdateLearnerPipe } from './learner-action.pipes'
import { LearnersService } from './learners.service'

@Controller('learners')
export class LearnersController {
  constructor(
    @Inject(LearnersService) private readonly learners: LearnersService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ParentSessionService) private readonly parentSession: ParentSessionService,
  ) {}

  @Get('current')
  async getCurrent(@Req() request: Request) {
    const parent = await this.parentSession.requireParent(request)
    return this.learners.getCurrent(parent.id)
  }

  @Patch('current')
  async update(
    @Req() request: Request,
    @Body(UpdateLearnerPipe) input: { nickname: string; avatarId: string },
  ) {
    const parent = await this.parentSession.requireParent(request)
    return this.learners.update(parent.id, input)
  }

  @Patch('current/pin')
  async updatePin(
    @Req() request: Request,
    @Body(UpdateLearnerPinPipe) input: { password: string; pin: string },
  ) {
    const parent = await this.parentSession.requireParent(request)
    if (!(await this.auth.verifyParentPassword(parent.id, input.password))) {
      throw new UnauthorizedException('邮箱或密码不正确')
    }
    return this.learners.updatePin(parent.id, input.pin)
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

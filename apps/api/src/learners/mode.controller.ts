import { Body, Controller, Inject, Post, Req, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

import { AuthService } from '../auth/auth.service'
import { CredentialRateLimitService } from '../auth/credential-rate-limit.service'
import { ParentSessionService } from '../auth/parent-session.service'
import { ReturnToParentPipe, SwitchToLearnerPipe } from './learner-action.pipes'
import { LearnersService } from './learners.service'

const INVALID_PIN = 'PIN 不正确'
const INVALID_PASSWORD = '邮箱或密码不正确'

@Controller('mode')
export class ModeController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(LearnersService) private readonly learners: LearnersService,
    @Inject(ParentSessionService) private readonly parentSession: ParentSessionService,
    @Inject(CredentialRateLimitService) private readonly rateLimit: CredentialRateLimitService,
  ) {}

  @Post('learner')
  async enterLearner(
    @Req() request: Request,
    @Body(SwitchToLearnerPipe) input: { pin: string },
  ) {
    const session = await this.parentSession.requireParent(request)
    const scope = `pin:${session.sessionId}`
    this.rateLimit.assertAllowed(scope, 5, 10 * 60 * 1000)
    if (!(await this.learners.verifyPin(session.id, input.pin))) {
      this.rateLimit.fail(scope, 10 * 60 * 1000)
      throw new UnauthorizedException(INVALID_PIN)
    }
    this.rateLimit.clear(scope)
    await this.auth.setSessionMode(session.sessionId, 'LEARNER')
    return { mode: 'learner' as const }
  }

  @Post('parent')
  async returnToParent(
    @Req() request: Request,
    @Body(ReturnToParentPipe) input: { password: string },
  ) {
    const session = await this.parentSession.requireLearner(request)
    const scope = `parent-return:${session.sessionId}`
    this.rateLimit.assertAllowed(scope, 5, 15 * 60 * 1000)
    if (!(await this.auth.verifyParentPassword(session.id, input.password))) {
      this.rateLimit.fail(scope, 15 * 60 * 1000)
      throw new UnauthorizedException(INVALID_PASSWORD)
    }
    this.rateLimit.clear(scope)
    await this.auth.setSessionMode(session.sessionId, 'PARENT')
    return { mode: 'parent' as const }
  }
}

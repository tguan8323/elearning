import { Body, Controller, Get, Inject, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { CredentialRateLimitService } from './credential-rate-limit.service'
import { PARENT_SESSION_COOKIE, ParentSessionService } from './parent-session.service'
import { ParentLoginDto } from './auth.dto'

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ParentSessionService) private readonly parentSession: ParentSessionService,
    @Inject(CredentialRateLimitService) private readonly rateLimit: CredentialRateLimitService,
  ) {}

  @Post('login')
  async login(
    @Req() request: Request,
    @Body() input: ParentLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const scope = `login:${request.ip ?? 'unknown'}:${input.email.trim().toLowerCase()}`
    this.rateLimit.assertAllowed(scope, 5, 15 * 60 * 1000)
    let session
    try {
      session = await this.auth.login(input.email, input.password)
      this.rateLimit.clear(scope)
    } catch (error) {
      this.rateLimit.fail(scope, 15 * 60 * 1000)
      throw error
    }
    response.cookie(PARENT_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: session.expiresAt,
      path: '/',
    })

    return { parent: { email: session.parent.email } }
  }

  @Get('session')
  async session(@Req() request: Request) {
    const session = await this.parentSession.requireSession(request)
    return session.mode === 'PARENT'
      ? { mode: 'parent', parent: { email: session.email } }
      : { mode: 'learner' }
  }

  @Get('me')
  async me(@Req() request: Request) {
    const parent = await this.parentSession.requireParent(request)
    return { parent: { email: parent.email } }
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.parentSession.readToken(request)
    if (token) await this.auth.logout(token)
    response.clearCookie(PARENT_SESSION_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    return { success: true }
  }
}

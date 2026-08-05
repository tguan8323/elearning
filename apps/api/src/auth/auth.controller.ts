import { Body, Controller, Get, Inject, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { PARENT_SESSION_COOKIE, ParentSessionService } from './parent-session.service'
import { ParentLoginDto } from './auth.dto'

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ParentSessionService) private readonly parentSession: ParentSessionService,
  ) {}

  @Post('login')
  async login(
    @Body() input: ParentLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(input.email, input.password)
    response.cookie(PARENT_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: session.expiresAt,
      path: '/',
    })

    return { parent: { email: session.parent.email } }
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

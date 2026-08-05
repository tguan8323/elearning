import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common'
import type { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { ParentLoginDto } from './auth.dto'

const SESSION_COOKIE = 'parent_session'
const UNAUTHORIZED_MESSAGE = '请先登录家长账号'

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('login')
  async login(
    @Body() input: ParentLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(input.email, input.password)
    response.cookie(SESSION_COOKIE, session.token, {
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
    const token = this.readSessionToken(request)
    const parent = token ? await this.auth.getParentForToken(token) : null
    if (!parent) throw new UnauthorizedException(UNAUTHORIZED_MESSAGE)
    return { parent: { email: parent.email } }
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.readSessionToken(request)
    if (token) await this.auth.logout(token)
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    return { success: true }
  }

  private readSessionToken(request: Request) {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : null
  }
}

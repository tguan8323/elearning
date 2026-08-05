import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

import { AuthService, type ParentSessionIdentity } from './auth.service'

export const PARENT_SESSION_COOKIE = 'parent_session'
const UNAUTHORIZED_MESSAGE = '请先登录家长账号'

@Injectable()
export class ParentSessionService {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  readToken(request: Request) {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${PARENT_SESSION_COOKIE}=`))
    return cookie ? decodeURIComponent(cookie.slice(PARENT_SESSION_COOKIE.length + 1)) : null
  }

  async requireParent(request: Request): Promise<ParentSessionIdentity> {
    const token = this.readToken(request)
    const parent = token ? await this.auth.getParentForToken(token) : null
    if (!parent) throw new UnauthorizedException(UNAUTHORIZED_MESSAGE)
    return parent
  }
}

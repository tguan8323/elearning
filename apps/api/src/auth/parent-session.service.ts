import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
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

  async requireSession(request: Request): Promise<ParentSessionIdentity> {
    const token = this.readToken(request)
    const parent = token ? await this.auth.getParentForToken(token) : null
    if (!parent) throw new UnauthorizedException(UNAUTHORIZED_MESSAGE)
    return parent
  }

  async requireParent(request: Request): Promise<ParentSessionIdentity> {
    const session = await this.requireSession(request)
    if (session.mode !== 'PARENT') {
      throw new ForbiddenException('孩子模式不能访问家长功能')
    }
    return session
  }

  async requireLearner(request: Request): Promise<ParentSessionIdentity> {
    const session = await this.requireSession(request)
    if (session.mode !== 'LEARNER') {
      throw new ForbiddenException('请先切换到孩子模式')
    }
    return session
  }
}

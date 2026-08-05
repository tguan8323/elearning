import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import type { ParentAccount, SessionMode } from '@prisma/client'
import { hash, verify } from 'argon2'
import { createHash, randomBytes } from 'node:crypto'

import { PrismaService } from '../database/prisma.service'

const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000
const SESSION_IDLE_MS = 2 * 60 * 60 * 1000
const INVALID_CREDENTIALS_MESSAGE = '邮箱或密码不正确'

export type ParentSessionIdentity = Pick<ParentAccount, 'id' | 'email'> & {
  sessionId: string
  mode: SessionMode
}

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async initializeParent(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email)
    const existing = await this.prisma.parentAccount.findFirst({ select: { id: true } })
    if (existing) return { created: false as const }

    const passwordHash = await hash(password, { type: 2 })

    try {
      await this.prisma.parentAccount.create({
        data: { email: normalizedEmail, passwordHash },
      })
      return { created: true as const }
    } catch (error) {
      const concurrent = await this.prisma.parentAccount.findFirst({ select: { id: true } })
      if (concurrent) return { created: false as const }
      throw error
    }
  }

  async login(email: string, password: string) {
    const parent = await this.prisma.parentAccount.findUnique({
      where: { email: this.normalizeEmail(email) },
    })
    const valid = parent ? await verify(parent.passwordHash, password) : false
    if (!parent || !valid) throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE)

    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS)
    await this.prisma.parentSession.create({
      data: {
        parentId: parent.id,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    })

    return { parent: { id: parent.id, email: parent.email }, token, expiresAt }
  }

  async getParentForToken(token: string): Promise<ParentSessionIdentity | null> {
    const now = new Date()
    const idleDeadline = new Date(now.getTime() - SESSION_IDLE_MS)
    const session = await this.prisma.parentSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { parent: { select: { id: true, email: true } } },
    })

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.lastSeenAt <= idleDeadline
    ) return null

    await this.prisma.parentSession.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    })
    return {
      ...session.parent,
      sessionId: session.id,
      mode: session.mode,
    }
  }

  async setSessionMode(sessionId: string, mode: SessionMode) {
    await this.prisma.parentSession.updateMany({
      where: { id: sessionId, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { mode, lastSeenAt: new Date() },
    })
  }

  async verifyParentPassword(parentId: string, password: string) {
    const parent = await this.prisma.parentAccount.findUnique({
      where: { id: parentId },
      select: { passwordHash: true },
    })
    return parent ? verify(parent.passwordHash, password) : false
  }

  async logout(token: string) {
    await this.prisma.parentSession.updateMany({
      where: { tokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }
}

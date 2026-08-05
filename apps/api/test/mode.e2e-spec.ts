import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from '../src/auth/auth.service'
import { CredentialRateLimitService } from '../src/auth/credential-rate-limit.service'
import { ParentSessionService } from '../src/auth/parent-session.service'
import { LearnersService } from '../src/learners/learners.service'
import { ModeController } from '../src/learners/mode.controller'

describe('session mode API', () => {
  let app: INestApplication
  const auth = { getParentForToken: vi.fn(), setSessionMode: vi.fn(), verifyParentPassword: vi.fn() }
  const learners = { verifyPin: vi.fn() }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ModeController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: LearnersService, useValue: learners },
        ParentSessionService,
        CredentialRateLimitService,
      ],
    }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
  })

  beforeEach(() => vi.resetAllMocks())
  afterAll(async () => app.close())

  it('does not allow a PIN to create a session', async () => {
    auth.getParentForToken.mockResolvedValue(null)
    const server = app.getHttpServer() as Parameters<typeof request>[0]
    await request(server).post('/api/mode/learner').send({ pin: '123456' }).expect(401)
    expect(learners.verifyPin).not.toHaveBeenCalled()
    expect(auth.setSessionMode).not.toHaveBeenCalled()
  })

  it('switches an existing parent session to learner mode with the correct PIN', async () => {
    auth.getParentForToken.mockResolvedValue({ id: 'parent-1', email: 'p@example.com', sessionId: 'session-1', mode: 'PARENT' })
    learners.verifyPin.mockResolvedValue(true)
    const server = app.getHttpServer() as Parameters<typeof request>[0]
    await request(server)
      .post('/api/mode/learner').set('Cookie', 'parent_session=valid').send({ pin: '123456' }).expect(201)
    expect(auth.setSessionMode).toHaveBeenCalledWith('session-1', 'LEARNER')
  })

  it('keeps learner mode when the parent password is wrong', async () => {
    auth.getParentForToken.mockResolvedValue({ id: 'parent-1', email: 'p@example.com', sessionId: 'session-1', mode: 'LEARNER' })
    auth.verifyParentPassword.mockResolvedValue(false)
    const server = app.getHttpServer() as Parameters<typeof request>[0]
    await request(server)
      .post('/api/mode/parent').set('Cookie', 'parent_session=valid').send({ password: 'wrong' }).expect(401)
    expect(auth.setSessionMode).not.toHaveBeenCalled()
  })

  it('restores parent mode after password verification', async () => {
    auth.getParentForToken.mockResolvedValue({ id: 'parent-1', email: 'p@example.com', sessionId: 'session-1', mode: 'LEARNER' })
    auth.verifyParentPassword.mockResolvedValue(true)
    const server = app.getHttpServer() as Parameters<typeof request>[0]
    await request(server)
      .post('/api/mode/parent').set('Cookie', 'parent_session=valid').send({ password: 'correct' }).expect(201)
    expect(auth.setSessionMode).toHaveBeenCalledWith('session-1', 'PARENT')
  })
})

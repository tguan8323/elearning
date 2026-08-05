import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthController } from '../src/auth/auth.controller'
import { AuthService } from '../src/auth/auth.service'
import { ParentSessionService } from '../src/auth/parent-session.service'

describe('parent auth API', () => {
  let app: INestApplication
  const auth = {
    login: vi.fn(),
    getParentForToken: vi.fn(),
    logout: vi.fn(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        ParentSessionService,
      ],
    }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
  })

  afterAll(async () => app.close())

  it('sets an HttpOnly SameSite session cookie after login', async () => {
    auth.login.mockResolvedValue({
      parent: { id: 'parent-1', email: 'parent@example.com' },
      token: 'raw-session-token',
      expiresAt: new Date(Date.now() + 60_000),
    })

    const server = app.getHttpServer() as Parameters<typeof request>[0]
    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'parent@example.com', password: 'correct-password' })
      .expect(201)

    const cookie = response.headers['set-cookie'] as unknown as string[]
    expect(cookie[0]).toContain('parent_session=raw-session-token')
    expect(cookie[0]).toContain('HttpOnly')
    expect(cookie[0]).toContain('SameSite=Lax')
  })

  it('rejects unauthenticated access and revokes the session on logout', async () => {
    auth.getParentForToken.mockResolvedValue(null)
    const server = app.getHttpServer() as Parameters<typeof request>[0]
    await request(server).get('/api/auth/me').expect(401)

    await request(server)
      .post('/api/auth/logout')
      .set('Cookie', 'parent_session=raw-session-token')
      .expect(201)
    expect(auth.logout).toHaveBeenCalledWith('raw-session-token')
  })
})

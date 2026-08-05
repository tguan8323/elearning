import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from '../src/auth/auth.service'
import { ParentSessionService } from '../src/auth/parent-session.service'
import { LearnersController } from '../src/learners/learners.controller'
import { LearnersService } from '../src/learners/learners.service'

describe('learner profile API', () => {
  let app: INestApplication
  const auth = { getParentForToken: vi.fn() }
  const learners = { getCurrent: vi.fn(), create: vi.fn() }

  beforeEach(() => vi.resetAllMocks())

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LearnersController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: LearnersService, useValue: learners },
        ParentSessionService,
      ],
    }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
  })

  afterAll(async () => app.close())

  it('rejects unauthenticated reads and writes', async () => {
    auth.getParentForToken.mockResolvedValue(null)
    const server = app.getHttpServer() as Parameters<typeof request>[0]
    await request(server).get('/api/learners/current').expect(401)
    await request(server)
      .post('/api/learners')
      .send({ nickname: '小星', avatarId: 'fox', pin: '123456' })
      .expect(401)
  })

  it('creates and reads the learner using parent ownership from the session', async () => {
    auth.getParentForToken.mockResolvedValue({ id: 'parent-1', email: 'parent@example.com' })
    const profile = { id: 'learner-1', nickname: '小星', avatarId: 'fox' }
    learners.create.mockResolvedValue(profile)
    learners.getCurrent.mockResolvedValue(profile)
    const server = app.getHttpServer() as Parameters<typeof request>[0]

    const created = await request(server)
      .post('/api/learners')
      .set('Cookie', 'parent_session=valid-token')
      .send({
        parentId: 'attacker-controlled-parent',
        nickname: '小星',
        avatarId: 'fox',
        pin: '123456',
      })
      .expect(201)
    expect(learners.create).toHaveBeenCalledWith('parent-1', {
      nickname: '小星',
      avatarId: 'fox',
      pin: '123456',
    })
    expect(created.body).toEqual(profile)
    expect(created.body).not.toHaveProperty('pin')
    expect(created.body).not.toHaveProperty('pinHash')

    const current = await request(server)
      .get('/api/learners/current')
      .set('Cookie', 'parent_session=valid-token')
      .expect(200)
    expect(learners.getCurrent).toHaveBeenCalledWith('parent-1')
    expect(current.body).toEqual(profile)
  })

  it.each([
    { nickname: '', avatarId: 'fox', pin: '123456' },
    { nickname: '小星', avatarId: 'unknown', pin: '123456' },
    { nickname: '小星', avatarId: 'fox', pin: '12345' },
    { nickname: '小星', avatarId: 'fox', pin: 'abcdef' },
  ])('rejects invalid learner input %#', async (body) => {
    auth.getParentForToken.mockResolvedValue({ id: 'parent-1', email: 'parent@example.com' })
    const server = app.getHttpServer() as Parameters<typeof request>[0]
    await request(server)
      .post('/api/learners')
      .set('Cookie', 'parent_session=valid-token')
      .send(body)
      .expect(400)
    expect(learners.create).not.toHaveBeenCalled()
  })
})

import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, describe, it } from 'vitest'

import { AppModule } from '../src/app.module'

describe('health API', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
  })

  it('responds on the prefixed endpoint', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()

    const server = app.getHttpServer() as Parameters<typeof request>[0]

    await request(server)
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'family-english-api' })
  })
})

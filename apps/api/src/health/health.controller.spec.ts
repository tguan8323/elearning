import { Test } from '@nestjs/testing'
import { describe, expect, it } from 'vitest'

import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('returns the public health response', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    expect(moduleRef.get(HealthController).getHealth()).toEqual({
      status: 'ok',
      service: 'family-english-api',
    })
  })
})

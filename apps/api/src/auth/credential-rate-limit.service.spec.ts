import { describe, expect, it, vi } from 'vitest'

import { CredentialRateLimitService } from './credential-rate-limit.service'

describe('CredentialRateLimitService', () => {
  it('blocks after the configured number of failures and resets after the window', () => {
    const limiter = new CredentialRateLimitService()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-05T00:00:00Z'))

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(() => limiter.assertAllowed('pin:session-1', 5, 60_000)).not.toThrow()
      limiter.fail('pin:session-1', 60_000)
    }
    expect(() => limiter.assertAllowed('pin:session-1', 5, 60_000)).toThrowError(
      '尝试次数过多，请稍后再试',
    )

    vi.advanceTimersByTime(60_000)
    expect(() => limiter.assertAllowed('pin:session-1', 5, 60_000)).not.toThrow()
    vi.useRealTimers()
  })

  it('clears a failed-attempt bucket after success', () => {
    const limiter = new CredentialRateLimitService()
    limiter.fail('login:test', 60_000)
    limiter.clear('login:test')
    expect(() => limiter.assertAllowed('login:test', 1, 60_000)).not.toThrow()
  })
})

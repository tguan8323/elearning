import { HttpException, HttpStatus, Injectable } from '@nestjs/common'

const LIMIT_MESSAGE = '尝试次数过多，请稍后再试'

type Bucket = { failures: number; resetsAt: number }

@Injectable()
export class CredentialRateLimitService {
  private readonly buckets = new Map<string, Bucket>()

  assertAllowed(scope: string, limit: number, windowMs: number) {
    const now = Date.now()
    const bucket = this.buckets.get(scope)
    if (!bucket || bucket.resetsAt <= now) {
      this.buckets.set(scope, { failures: 0, resetsAt: now + windowMs })
      return
    }
    if (bucket.failures >= limit) throw new HttpException(LIMIT_MESSAGE, HttpStatus.TOO_MANY_REQUESTS)
  }

  fail(scope: string, windowMs: number) {
    const now = Date.now()
    const bucket = this.buckets.get(scope)
    if (!bucket || bucket.resetsAt <= now) {
      this.buckets.set(scope, { failures: 1, resetsAt: now + windowMs })
      return
    }
    bucket.failures += 1
  }

  clear(scope: string) {
    this.buckets.delete(scope)
  }
}

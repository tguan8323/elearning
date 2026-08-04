import { Injectable } from '@nestjs/common'
import type { ReadinessResponse } from '@family-english/contracts'

import { PrismaService } from '../database/prisma.service'

@Injectable()
export class ReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<ReadinessResponse> {
    await this.prisma.$queryRaw`SELECT 1`

    return {
      status: 'ready',
      service: 'family-english-api',
      dependencies: { database: 'connected' },
    }
  }
}

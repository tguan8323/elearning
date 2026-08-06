import { Body, Controller, Get, Inject, Post, Query, Req } from '@nestjs/common'
import type { Request } from 'express'

import { ParentSessionService } from '../auth/parent-session.service'
import { SyncService } from './sync.service'

@Controller('sync')
export class SyncController {
  constructor(
    @Inject(SyncService) private readonly sync: SyncService,
    @Inject(ParentSessionService) private readonly sessions: ParentSessionService,
  ) {}

  @Post('operations')
  async replay(@Req() request: Request, @Body() operation: Parameters<SyncService['replay']>[1]) {
    const parent = await this.sessions.requireParent(request)
    return this.sync.replay(parent.id, operation)
  }

  @Get('changes')
  async pull(@Req() request: Request, @Query('cursor') cursor?: string) {
    const parent = await this.sessions.requireParent(request)
    return this.sync.pull(parent.id, cursor)
  }

  @Post('verify-package')
  async verifyPackage(@Req() request: Request, @Body() input: { payload: unknown; checksum: string }) {
    await this.sessions.requireParent(request)
    const actualChecksum = this.sync.packageChecksum(input.payload)
    return { valid: actualChecksum === input.checksum, actualChecksum }
  }
}

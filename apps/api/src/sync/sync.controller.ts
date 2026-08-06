import { Body, Controller, Get, Inject, Post, Query, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'

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

  @Get('package/download')
  async packageDownload(@Req() request: Request, @Res() response: Response) {
    const parent = await this.sessions.requireParent(request)
    const bundle = await this.sync.packageBundle(parent.id)
    response.setHeader('Cache-Control', 'private, no-store')
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Content-Disposition', `attachment; filename="family-english-${bundle.version}.json"`)
    return response.send(bundle.body)
  }
  @Get('package')
  async packageManifest(@Req() request: Request) { const parent = await this.sessions.requireParent(request); return this.sync.packageManifest(parent.id) }

  @Post('verify-package')
  async verifyPackage(@Req() request: Request, @Body() input: { payload: unknown; checksum: string }) {
    await this.sessions.requireParent(request)
    const actualChecksum = this.sync.packageChecksum(input.payload)
    return { valid: actualChecksum === input.checksum, actualChecksum }
  }
}

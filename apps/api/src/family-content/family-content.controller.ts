import { Body, Controller, Delete, Get, Inject, Param, Post, Req } from '@nestjs/common'
import type { Request } from 'express'
import { ParentSessionService } from '../auth/parent-session.service'
import { BindAssetPipe, CreateAssetPipe } from './family-content.dto'
import { FamilyContentService } from './family-content.service'

@Controller('family-content')
export class FamilyContentController {
  constructor(@Inject(FamilyContentService) private readonly content: FamilyContentService, @Inject(ParentSessionService) private readonly sessions: ParentSessionService) {}

  @Get('notice') notice() { return { copyrightResponsibility: '家长须确认拥有或获准使用上传内容；禁止上传商业教材内容。' } }
  @Get('assets') async list(@Req() req: Request) { const parent = await this.sessions.requireParent(req); return this.content.list(parent.id) }
  @Post('assets') async create(@Req() req: Request, @Body(CreateAssetPipe) input: any) { const parent = await this.sessions.requireParent(req); return this.content.catalog(parent.id, input) }
  @Post('versions/:versionId/bindings') async bind(@Req() req: Request, @Param('versionId') id: string, @Body(BindAssetPipe) input: { slotId: string }) { const parent = await this.sessions.requireParent(req); return this.content.bind(parent.id, id, input.slotId) }
  @Post('bindings/:bindingId/publish') async publish(@Req() req: Request, @Param('bindingId') id: string) { const parent = await this.sessions.requireParent(req); return this.content.publish(parent.id, id) }
  @Post('publications/:publicationId/withdraw') async withdraw(@Req() req: Request, @Param('publicationId') id: string) { const parent = await this.sessions.requireParent(req); return this.content.withdraw(parent.id, id) }
  @Delete('assets/:assetId') async remove(@Req() req: Request, @Param('assetId') id: string) { const parent = await this.sessions.requireParent(req); return this.content.remove(parent.id, id) }
}

@Controller('learner/family-content')
export class LearnerFamilyContentController {
  constructor(@Inject(FamilyContentService) private readonly content: FamilyContentService, @Inject(ParentSessionService) private readonly sessions: ParentSessionService) {}
  @Get() async list(@Req() req: Request) { const session = await this.sessions.requireLearner(req); return this.content.learnerPublished(session.id) }
}

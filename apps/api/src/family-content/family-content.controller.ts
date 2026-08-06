/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Delete, Get, Headers, Inject, Param, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { ParentSessionService } from '../auth/parent-session.service'
import { CreateAssetPipe, BindAssetPipe } from './family-content.dto'
import { FamilyContentService } from './family-content.service'

@Controller('family-content')
export class FamilyContentController {
  constructor(@Inject(FamilyContentService) private readonly content: FamilyContentService, @Inject(ParentSessionService) private readonly sessions: ParentSessionService) {}

  @Get('notice') notice() { return { copyrightResponsibility: '家长须确认拥有或获准使用上传内容；禁止上传商业教材内容。' } }
  @Get('assets') async list(@Req() req: Request) { const parent = await this.sessions.requireParent(req); return this.content.list(parent.id) }
  @Get('slots') async slots(@Req() req: Request) { await this.sessions.requireParent(req); return this.content.slots() }
  @Post('versions/:versionId/bind') async bind(@Req() req: Request, @Param('versionId') versionId: string, @Body(BindAssetPipe) input: ReturnType<BindAssetPipe['transform']>) { const parent = await this.sessions.requireParent(req); return this.content.bind(parent.id, versionId, input.slotId) }
  @Post('assets') async create(@Req() req: Request, @Body(CreateAssetPipe) input: ReturnType<CreateAssetPipe['transform']>) { const parent = await this.sessions.requireParent(req); return this.content.catalog(parent.id, input) }
  @Post('versions/:versionId/audio-review') async reviewAudio(@Req() req: Request, @Param('versionId') id: string, @Body() input: { reviewState: 'APPROVED' | 'REJECTED'; reviewerNote?: string }) { const parent = await this.sessions.requireParent(req); return this.content.reviewAudio(parent.id, id, input.reviewState, input.reviewerNote) }
  @Get('versions/:versionId/audio-review') async audioReview(@Req() req: Request, @Param('versionId') id: string) { const parent = await this.sessions.requireParent(req); return this.content.audioReview(parent.id, id) }
 async upload(@Req() req: Request, @Param('versionId') id: string, @Headers('content-length') length: string | undefined) { const parent = await this.sessions.requireParent(req); const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); const body = Buffer.concat(chunks); if (length && Number(length) !== body.length) throw new Error('content-length mismatch'); return this.content.upload(parent.id, id, body) }
  @Get('versions/:versionId/preview') async preview(@Req() req: Request, @Param('versionId') id: string, @Res() response: Response) { const parent = await this.sessions.requireParent(req); const version = await this.content.preview(parent.id, id); response.setHeader('Cache-Control', 'private, no-store'); response.setHeader('Content-Type', version.mimeType); return response.send(version.body) }
  @Post('bindings/:bindingId/publish') async publish(@Req() req: Request, @Param('bindingId') id: string) { const parent = await this.sessions.requireParent(req); return this.content.publish(parent.id, id) }
  @Post('publications/:publicationId/withdraw') async withdraw(@Req() req: Request, @Param('publicationId') id: string) { const parent = await this.sessions.requireParent(req); return this.content.withdraw(parent.id, id) }
  @Delete('assets/:assetId') async remove(@Req() req: Request, @Param('assetId') id: string) { const parent = await this.sessions.requireParent(req); return this.content.remove(parent.id, id) }
}

@Controller('learner/family-content')
export class LearnerFamilyContentController {
  constructor(@Inject(FamilyContentService) private readonly content: FamilyContentService, @Inject(ParentSessionService) private readonly sessions: ParentSessionService) {}
  @Get() async list(@Req() req: Request) { const session = await this.sessions.requireLearner(req); return this.content.learnerPublished(session.id) }
  @Get(':publicationId/media') async media(@Req() req: Request, @Param('publicationId') id: string, @Res() response: Response) { const session = await this.sessions.requireLearner(req); const media = await this.content.publicationMedia(session.id, id); response.setHeader('Cache-Control', 'private, no-store'); response.setHeader('Content-Type', media.mimeType); return response.send(media.body) }

}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import type { Prisma } from '@prisma/client'
import { existsSync, mkdirSync, promises as fs } from 'node:fs'
import { join } from 'node:path'
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { COPYRIGHT_NOTICE } from './family-content.dto'

export interface ObjectStorage { enabled: boolean; put(key: string, body: Buffer, mimeType: string): Promise<void>; get?(key: string): Promise<Buffer> }
export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE')

@Injectable()
export class LocalObjectStorage implements ObjectStorage {
  readonly enabled = true
  private readonly root = process.env.OBJECT_STORAGE_PATH ?? join(process.cwd(), 'data', 'objects')
  async put(key: string, body: Buffer): Promise<void> {
    const path = join(this.root, key)
    mkdirSync(join(path, '..'), { recursive: true })
    await fs.writeFile(path, body, { flag: 'wx' })
  }
  async get(key: string) { return fs.readFile(join(this.root, key)) }
  has(key: string) { return existsSync(join(this.root, key)) }
}

@Injectable()
export class MetadataOnlyStorage implements ObjectStorage {
  readonly enabled = false
  put(): Promise<void> { return Promise.reject(new BadRequestException('对象存储未配置；内容仅保存元数据，未声称文件已上传')) }
}

@Injectable()
export class FamilyContentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage) {}

  async slots() {
    const slots = await this.prisma.contentSlot.findMany({ orderBy: { id: 'asc' } })
    if (slots.length) return slots
    return [
      { id: 'learner-visual', title: '孩子页面图片', purpose: '低刺激视觉提示', acceptedMimeTypes: ['image/png', 'image/jpeg'], maxFileSize: 5 * 1024 * 1024, learnerEligible: true },
      { id: 'learner-audio', title: '孩子页面音频', purpose: '家长审核的英语音频', acceptedMimeTypes: ['audio/mpeg', 'audio/wav'], maxFileSize: 25 * 1024 * 1024, learnerEligible: true },
      { id: 'parent-reference', title: '家长参考', purpose: '只供家长准备和参考', acceptedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'], maxFileSize: 25 * 1024 * 1024, learnerEligible: false },
    ]
  }

  async reviewAudio(parentId: string, versionId: string, reviewState: 'APPROVED' | 'REJECTED', reviewerNote?: string) {
    const version = await this.ownedVersion(parentId, versionId)
    if (!['audio/mpeg', 'audio/wav'].includes(version.mimeType)) throw new BadRequestException('只有音频版本可以审核')
    return this.prisma.audioReview.upsert({ where: { assetVersionId: versionId }, update: { reviewState, reviewerNote, accent: 'en-US', reviewedAt: new Date() }, create: { id: `${versionId}-review`, assetVersionId: versionId, reviewState, reviewerNote, accent: 'en-US', reviewedAt: new Date() } })
  }

  async audioReview(parentId: string, versionId: string) { const version = await this.ownedVersion(parentId, versionId); return this.prisma.audioReview.findUnique({ where: { assetVersionId: version.id } }) }

  async catalog(parentId: string, input: any) {
    return this.prisma.familyAsset.create({ data: {
      parentId, title: input.title, mediaType: input.mediaType, source: input.source, purpose: input.purpose,
      targetLanguage: input.targetLanguage, courseRefs: input.courseRefs, stimulusFeatures: input.stimulusFeatures,
      copyrightNotice: COPYRIGHT_NOTICE,
      versions: { create: { version: 1, mimeType: input.mimeType, fileName: input.fileName, fileSize: input.fileSize, uploadState: 'METADATA_ONLY' } },
    }, include: { versions: true } })
  }

  async list(parentId: string) {
    return this.prisma.familyAsset.findMany({
      where: { parentId },
      include: { versions: { include: { audioReview: true, bindings: { include: { publications: true, slot: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async preview(parentId: string, versionId: string) {
    const version = await this.ownedVersion(parentId, versionId)
    if (version.uploadState !== 'UPLOADED' || !version.storageKey || !this.storage.get) throw new NotFoundException('文件尚未上传')
    return { mimeType: version.mimeType, body: await this.storage.get(version.storageKey) }
  }

  async upload(parentId: string, versionId: string, body: Buffer) {
    const version = await this.ownedVersion(parentId, versionId)
    if (body.length !== version.fileSize) throw new BadRequestException('实际文件大小与声明不一致')
    if (!this.matchesMagic(version.mimeType, body)) throw new BadRequestException('文件魔数与声明的 MIME 类型不一致')
    const storageKey = `${parentId}/${version.assetId}/${version.id}`
    await this.storage.put(storageKey, body, version.mimeType)
    return this.prisma.assetVersion.update({ where: { id: version.id }, data: { storageKey, uploadState: 'UPLOADED', fileSize: body.length } })
  }

  private matchesMagic(mime: string, body: Buffer) {
    if (mime === 'image/png') return body.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    if (mime === 'image/jpeg') return body.subarray(0, 3).equals(Buffer.from([255,216,255]))
    if (mime === 'application/pdf') return body.subarray(0, 5).toString() === '%PDF-'
    if (mime === 'audio/mpeg') return body.length >= 3 && (body.subarray(0, 3).toString() === 'ID3' || (body[0] === 0xff && ((body[1] ?? 0) & 0xe0) === 0xe0))
    if (mime === 'audio/wav') return body.subarray(0, 4).toString() === 'RIFF' && body.subarray(8, 12).toString() === 'WAVE'
    if (mime === 'video/mp4') return body.subarray(4, 8).toString() === 'ftyp'
    return body.length > 0
  }

  async bind(parentId: string, versionId: string, slotId: string) {
    const version = await this.ownedVersion(parentId, versionId)
    const slot = await this.prisma.contentSlot.findUnique({ where: { id: slotId } })
    if (!slot) throw new NotFoundException('内容插槽不存在')
    if (!slot.acceptedMimeTypes.includes(version.mimeType) || version.fileSize > slot.maxFileSize) throw new BadRequestException('内容与插槽的 MIME 类型或大小限制不兼容')
    const previewSnapshot = this.snapshot(version.asset, version, slot)
    return this.prisma.assetBinding.create({ data: { versionId, slotId, previewSnapshot } })
  }

  async publish(parentId: string, bindingId: string) {
    const binding = await this.prisma.assetBinding.findUnique({ where: { id: bindingId }, include: { version: { include: { asset: true, audioReview: true } }, slot: true } })
    if (!binding) throw new NotFoundException('绑定不存在')
    if (binding.version.asset.parentId !== parentId) throw new ForbiddenException('不能访问其他家庭的内容')
    if (!binding.slot.learnerEligible) throw new BadRequestException('此插槽不允许发布到孩子页面')
    if (binding.version.uploadState !== 'UPLOADED') throw new BadRequestException('文件尚未真实上传，不能发布')
    if (binding.version.mimeType.startsWith('audio/') && binding.version.audioReview?.reviewState !== 'APPROVED') throw new BadRequestException('音频必须先通过家长审核才能发布')
    return this.prisma.publication.create({ data: { parentId, bindingId, versionId: binding.versionId, snapshot: binding.previewSnapshot as Prisma.InputJsonValue } })
  }

  async withdraw(parentId: string, publicationId: string) {
    const publication = await this.prisma.publication.findUnique({ where: { id: publicationId } })
    if (!publication) throw new NotFoundException('发布记录不存在')
    if (publication.parentId !== parentId) throw new ForbiddenException('不能访问其他家庭的内容')
    return this.prisma.publication.update({ where: { id: publicationId }, data: { state: 'WITHDRAWN', withdrawnAt: new Date() } })
  }

  async publicationMedia(parentId: string, publicationId: string) {
    const publication = await this.prisma.publication.findUnique({ where: { id: publicationId }, include: { version: true } })
    if (!publication || publication.parentId !== parentId || publication.state !== 'PUBLISHED' || !publication.version.storageKey || !this.storage.get) throw new NotFoundException('媒体不存在')
    if (publication.version.mimeType.startsWith('audio/')) {
      const review = await this.prisma.audioReview.findUnique({ where: { assetVersionId: publication.versionId } })
      if (review?.reviewState !== 'APPROVED') throw new NotFoundException('音频尚未审核')
    }
    return { mimeType: publication.version.mimeType, body: await this.storage.get(publication.version.storageKey) }
  }
  async learnerPublished(parentId: string) {
    return this.prisma.publication.findMany({ where: { parentId, state: 'PUBLISHED', binding: { slot: { learnerEligible: true }, version: { OR: [{ mimeType: { not: { startsWith: 'audio/' } } }, { audioReview: { reviewState: 'APPROVED' } }] } } }, select: { id: true, snapshot: true, publishedAt: true } })
  }

  async remove(parentId: string, assetId: string) {
    const asset = await this.prisma.familyAsset.findUnique({ where: { id: assetId }, include: { versions: { include: { bindings: { include: { publications: true } } } } } })
    if (!asset) throw new NotFoundException('家庭内容不存在')
    if (asset.parentId !== parentId) throw new ForbiddenException('不能访问其他家庭的内容')
    const referenced = asset.versions.some((v) => v.bindings.some((b) => b.publications.length > 0))
    if (referenced) throw new ConflictException('内容已被发布历史引用；请撤回并保留历史快照，不能删除')
    await this.prisma.familyAsset.delete({ where: { id: assetId } })
    return { deleted: true }
  }

  private async ownedVersion(parentId: string, versionId: string) {
    const version = await this.prisma.assetVersion.findUnique({ where: { id: versionId }, include: { asset: true } })
    if (!version) throw new NotFoundException('内容版本不存在')
    if (version.asset.parentId !== parentId) throw new ForbiddenException('不能访问其他家庭的内容')
    return version
  }

  private snapshot(asset: any, version: any, slot: any) { return { assetId: asset.id, versionId: version.id, title: asset.title, mediaType: asset.mediaType, source: asset.source, purpose: asset.purpose, targetLanguage: asset.targetLanguage, courseRefs: asset.courseRefs, stimulusFeatures: asset.stimulusFeatures, copyrightNotice: asset.copyrightNotice, mimeType: version.mimeType, fileName: version.fileName, fileSize: version.fileSize, storageKey: version.storageKey, slotId: slot.id, slotTitle: slot.title } }
}

export const storageProvider = { provide: OBJECT_STORAGE, useFactory: () => new LocalObjectStorage() }

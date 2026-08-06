import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import { COPYRIGHT_NOTICE } from './family-content.dto'

export interface ObjectStorage { enabled: boolean; put(key: string, body: Buffer, mimeType: string): Promise<void> }
export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE')

@Injectable()
export class MetadataOnlyStorage implements ObjectStorage {
  readonly enabled = false
  async put() { throw new BadRequestException('对象存储未配置；内容仅保存元数据，未声称文件已上传') }
}

@Injectable()
export class FamilyContentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage) {}

  async catalog(parentId: string, input: any) {
    return this.prisma.familyAsset.create({ data: {
      parentId, title: input.title, mediaType: input.mediaType, source: input.source, purpose: input.purpose,
      targetLanguage: input.targetLanguage, courseRefs: input.courseRefs, stimulusFeatures: input.stimulusFeatures,
      copyrightNotice: COPYRIGHT_NOTICE,
      versions: { create: { version: 1, mimeType: input.mimeType, fileName: input.fileName, fileSize: input.fileSize, uploadState: 'METADATA_ONLY' } },
    }, include: { versions: true } })
  }

  async list(parentId: string) { return this.prisma.familyAsset.findMany({ where: { parentId }, include: { versions: true }, orderBy: { createdAt: 'desc' } }) }

  async bind(parentId: string, versionId: string, slotId: string) {
    const version = await this.ownedVersion(parentId, versionId)
    const slot = await this.prisma.contentSlot.findUnique({ where: { id: slotId } })
    if (!slot) throw new NotFoundException('内容插槽不存在')
    if (!slot.acceptedMimeTypes.includes(version.mimeType) || version.fileSize > slot.maxFileSize) throw new BadRequestException('内容与插槽的 MIME 类型或大小限制不兼容')
    const previewSnapshot = this.snapshot(version.asset, version, slot)
    return this.prisma.assetBinding.create({ data: { versionId, slotId, previewSnapshot } })
  }

  async publish(parentId: string, bindingId: string) {
    const binding = await this.prisma.assetBinding.findUnique({ where: { id: bindingId }, include: { version: { include: { asset: true } }, slot: true } })
    if (!binding) throw new NotFoundException('绑定不存在')
    if (binding.version.asset.parentId !== parentId) throw new ForbiddenException('不能访问其他家庭的内容')
    if (!binding.slot.learnerEligible) throw new BadRequestException('此插槽不允许发布到孩子页面')
    if (binding.version.uploadState !== 'UPLOADED') throw new BadRequestException('文件尚未真实上传，不能发布')
    return this.prisma.publication.create({ data: { parentId, bindingId, versionId: binding.versionId, snapshot: binding.previewSnapshot as Prisma.InputJsonValue } })
  }

  async withdraw(parentId: string, publicationId: string) {
    const publication = await this.prisma.publication.findUnique({ where: { id: publicationId } })
    if (!publication) throw new NotFoundException('发布记录不存在')
    if (publication.parentId !== parentId) throw new ForbiddenException('不能访问其他家庭的内容')
    return this.prisma.publication.update({ where: { id: publicationId }, data: { state: 'WITHDRAWN', withdrawnAt: new Date() } })
  }

  async learnerPublished(parentId: string) {
    return this.prisma.publication.findMany({ where: { parentId, state: 'PUBLISHED', binding: { slot: { learnerEligible: true } } }, select: { id: true, snapshot: true, publishedAt: true } })
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

export const storageProvider = { provide: OBJECT_STORAGE, inject: [ConfigService], useFactory: (_config: ConfigService) => new MetadataOnlyStorage() }

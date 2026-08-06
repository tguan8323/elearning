/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FamilyContentService } from './family-content.service'

const asset = { id: 'asset-1', parentId: 'parent-1', title: '原创图片', mediaType: 'IMAGE', source: '家长自制', purpose: '音素图片', targetLanguage: 'en', courseRefs: ['s'], stimulusFeatures: [], copyrightNotice: 'notice' }
const version = { id: 'version-1', assetId: asset.id, mimeType: 'image/png', fileName: 's.png', fileSize: 100, uploadState: 'METADATA_ONLY', storageKey: null, asset }
const slot = { id: 'phoneme-image', title: '音素图片', acceptedMimeTypes: ['image/png'], maxFileSize: 1000, learnerEligible: true }

describe('FamilyContentService', () => {
  let prisma: any
  let service: FamilyContentService
  beforeEach(() => {
    prisma = { familyAsset: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() }, assetVersion: { findUnique: vi.fn() }, contentSlot: { findUnique: vi.fn() }, assetBinding: { create: vi.fn(), findUnique: vi.fn() }, publication: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() }, audioReview: { upsert: vi.fn(), findUnique: vi.fn() } }
    service = new FamilyContentService(prisma, { enabled: false, put: vi.fn() })
  })

  it('catalogs metadata truthfully as not uploaded and records copyright responsibility', async () => {
    prisma.familyAsset.create.mockResolvedValue({ ...asset, versions: [version] })
    await service.catalog('parent-1', { ...asset, courseRefs: ['s'], stimulusFeatures: [], mimeType: 'image/png', fileName: 's.png', fileSize: 100 })
    expect(prisma.familyAsset.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ parentId: 'parent-1', copyrightNotice: expect.stringContaining('商业教材'), versions: { create: expect.objectContaining({ uploadState: 'METADATA_ONLY' }) } }) }))
  })

  it('enforces ownership before binding and validates slot compatibility', async () => {
    prisma.assetVersion.findUnique.mockResolvedValue({ ...version, asset: { ...asset, parentId: 'other' } })
    await expect(service.bind('parent-1', version.id, slot.id)).rejects.toBeInstanceOf(ForbiddenException)
    prisma.assetVersion.findUnique.mockResolvedValue(version); prisma.contentSlot.findUnique.mockResolvedValue({ ...slot, acceptedMimeTypes: ['audio/mpeg'] })
    await expect(service.bind('parent-1', version.id, slot.id)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('stores an immutable preview snapshot when binding', async () => {
    prisma.assetVersion.findUnique.mockResolvedValue(version); prisma.contentSlot.findUnique.mockResolvedValue(slot); prisma.assetBinding.create.mockResolvedValue({ id: 'binding-1' })
    await service.bind('parent-1', version.id, slot.id)
    expect(prisma.assetBinding.create).toHaveBeenCalledWith({ data: expect.objectContaining({ previewSnapshot: expect.objectContaining({ title: '原创图片', versionId: 'version-1', slotId: 'phoneme-image' }) }) })
  })

  it('never publishes metadata-only content and publishes the frozen preview only after upload', async () => {
    const binding = { id: 'binding-1', versionId: version.id, previewSnapshot: { title: 'frozen' }, version, slot }
    prisma.assetBinding.findUnique.mockResolvedValue(binding)
    await expect(service.publish('parent-1', binding.id)).rejects.toBeInstanceOf(BadRequestException)
    binding.version = { ...version, uploadState: 'UPLOADED' }; prisma.publication.create.mockResolvedValue({ id: 'pub-1' })
    await service.publish('parent-1', binding.id)
    expect(prisma.publication.create).toHaveBeenCalledWith({ data: expect.objectContaining({ snapshot: { title: 'frozen' }, versionId: version.id }) })
  })

  it('returns only active learner-eligible publications', async () => {
    prisma.publication.findMany.mockResolvedValue([])
    await service.learnerPublished('parent-1')
    expect(prisma.publication.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ parentId: 'parent-1', state: 'PUBLISHED', binding: expect.objectContaining({ slot: { learnerEligible: true }, version: expect.any(Object) }) }) }))
  })

  it('blocks deletion when any publication history references the asset', async () => {
    prisma.familyAsset.findUnique.mockResolvedValue({ ...asset, versions: [{ bindings: [{ publications: [{ id: 'pub-1', state: 'WITHDRAWN' }] }] }] })
    await expect(service.remove('parent-1', asset.id)).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.familyAsset.delete).not.toHaveBeenCalled()
  })
})

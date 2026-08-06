import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

export const COPYRIGHT_NOTICE = '家长确认拥有或获准使用此内容，并对版权与使用许可负责。请勿上传商业教材、书页、插图、录音或其他受保护内容。'
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'video/mp4', 'application/pdf', 'text/plain'] as const
export const MAX_FILE_SIZE = 25 * 1024 * 1024

function text(value: unknown, field: string, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new BadRequestException(`${field} 无效`)
  return value.trim()
}

@Injectable()
export class CreateAssetPipe implements PipeTransform {
  transform(value: Record<string, unknown>) {
    const mimeType = text(value.mimeType, 'mimeType', 100)
    const fileSize = Number(value.fileSize)
    if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) throw new BadRequestException('不支持的 MIME 类型')
    if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) throw new BadRequestException('文件大小无效或超过 25MB')
    if (value.acceptCopyrightResponsibility !== true) throw new BadRequestException('必须确认版权责任')
    const list = (name: string) => Array.isArray(value[name]) ? value[name].filter((item): item is string => typeof item === 'string').slice(0, 50) : []
    return {
      title: text(value.title, 'title'), mediaType: text(value.mediaType, 'mediaType', 40),
      source: text(value.source, 'source'), purpose: text(value.purpose, 'purpose'),
      targetLanguage: typeof value.targetLanguage === 'string' ? value.targetLanguage.trim() : undefined,
      courseRefs: list('courseRefs'), stimulusFeatures: list('stimulusFeatures'), mimeType,
      fileName: text(value.fileName, 'fileName'), fileSize,
    }
  }
}

@Injectable()
export class BindAssetPipe implements PipeTransform {
  transform(value: Record<string, unknown>) { return { slotId: text(value.slotId, 'slotId') } }
}

import { PrismaClient } from '@prisma/client'
import { hash } from 'argon2'

const email = process.env.SYNTHETIC_PARENT_EMAIL?.trim().toLowerCase()
const password = process.env.SYNTHETIC_PARENT_PASSWORD
if (!email || !password) throw new Error('Synthetic fixture requires environment credentials')
const fixtureEmail = email
const fixturePassword = password
const prisma = new PrismaClient()
async function main() {
  const passwordHash = await hash(fixturePassword, { type: 2 })
  const existing = await prisma.parentAccount.findUnique({ where: { email: fixtureEmail } })
  const parent = existing ?? await prisma.parentAccount.create({ data: { familySlot: `synthetic-${fixtureEmail}`, email: fixtureEmail, passwordHash } })
  if (existing) await prisma.parentAccount.update({ where: { id: existing.id }, data: { passwordHash } })
  await prisma.learnerProfile.upsert({ where: { parentId: parent.id }, update: {}, create: { parentId: parent.id, nickname: 'Synthetic learner', avatarId: 'star', pinHash: await hash('123456', { type: 2 }) } })
  await prisma.contentSlot.createMany({ data: [
    { id: 'learner-visual', title: '孩子页面图片', purpose: '低刺激视觉提示', acceptedMimeTypes: ['image/png', 'image/jpeg'], maxFileSize: 5 * 1024 * 1024, learnerEligible: true },
    { id: 'learner-audio', title: '审核英语音频', purpose: '家长审核后的美式英语示范与朗读', acceptedMimeTypes: ['audio/mpeg', 'audio/wav'], maxFileSize: 25 * 1024 * 1024, learnerEligible: true },
    { id: 'learner-video', title: '孩子页面视频', purpose: '低刺激家庭教学视频', acceptedMimeTypes: ['video/mp4'], maxFileSize: 25 * 1024 * 1024, learnerEligible: true },
    { id: 'flash-card-activity', title: 'Flash Cards / 活动说明', purpose: '家庭自有闪卡导航和原创活动说明', acceptedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'], maxFileSize: 10 * 1024 * 1024, learnerEligible: true },
    { id: 'wordless-reading', title: '无字书 / 朗读', purpose: '家庭自有无字书导航或家长原创朗读材料', acceptedMimeTypes: ['image/png', 'image/jpeg', 'audio/mpeg', 'audio/wav', 'application/pdf'], maxFileSize: 25 * 1024 * 1024, learnerEligible: true },
    { id: 'decodable-reading', title: '可解码阅读', purpose: '符合当前可解码范围的家庭原创或获授权材料', acceptedMimeTypes: ['application/pdf', 'text/plain', 'image/png', 'image/jpeg'], maxFileSize: 25 * 1024 * 1024, learnerEligible: true },
    { id: 'ort-navigation', title: 'ORT 实体书导航', purpose: '只记录家庭实体书标题、级别和取用位置', acceptedMimeTypes: ['text/plain'], maxFileSize: 1024 * 1024, learnerEligible: true },
    { id: 'lesson-review', title: '课前回顾', purpose: '已接触目标的低刺激回顾材料', acceptedMimeTypes: ['image/png', 'image/jpeg', 'audio/mpeg', 'audio/wav', 'text/plain'], maxFileSize: 25 * 1024 * 1024, learnerEligible: true },
    { id: 'independent-practice', title: '独立巩固', purpose: '仅用于已陪伴接触目标的独立巩固', acceptedMimeTypes: ['image/png', 'image/jpeg', 'audio/mpeg', 'audio/wav', 'text/plain'], maxFileSize: 25 * 1024 * 1024, learnerEligible: true },
    { id: 'parent-reference', title: '家长参考', purpose: '只供家长准备和参考', acceptedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'], maxFileSize: 25 * 1024 * 1024, learnerEligible: false },
  ], skipDuplicates: true })
  console.log('synthetic fixture ready')
}
void main().then(() => prisma.$disconnect()).catch(async (error: unknown) => { await prisma.$disconnect(); throw error })

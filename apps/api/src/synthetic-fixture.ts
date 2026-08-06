import { PrismaClient } from '@prisma/client'
import { hash } from 'argon2'

const email = process.env.SYNTHETIC_PARENT_EMAIL?.trim().toLowerCase()
const password = process.env.SYNTHETIC_PARENT_PASSWORD
if (!email || !password) throw new Error('Synthetic fixture requires environment credentials')
const fixtureEmail = email
const fixturePassword = password
const prisma = new PrismaClient()
async function main() {
  const parent = await prisma.parentAccount.upsert({ where: { email: fixtureEmail }, update: { passwordHash: await hash(fixturePassword, { type: 2 }) }, create: { email: fixtureEmail, passwordHash: await hash(fixturePassword, { type: 2 }) } })
  await prisma.learnerProfile.upsert({ where: { parentId: parent.id }, update: {}, create: { parentId: parent.id, nickname: 'Synthetic learner', avatarId: 'star', pinHash: await hash('123456', { type: 2 }) } })
  console.log('synthetic fixture ready')
}
main().finally(() => prisma.$disconnect())

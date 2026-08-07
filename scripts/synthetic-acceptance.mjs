import { execFileSync } from 'node:child_process'

const databaseUrl = process.env.DATABASE_URL ?? ''
if (!databaseUrl.includes('127.0.0.1') && !databaseUrl.includes('localhost')) {
  throw new Error('Synthetic acceptance requires a local DATABASE_URL')
}

execFileSync('corepack', ['pnpm', 'prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: { ...process.env, SYNTHETIC_FIXTURE: 'true' } })
execFileSync('corepack', ['pnpm', 'test:e2e', '--', 'e2e/authenticated-synthetic.spec.ts'], { stdio: 'inherit', env: { ...process.env, SYNTHETIC_FIXTURE: 'true' } })

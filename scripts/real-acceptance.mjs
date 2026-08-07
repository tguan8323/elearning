import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'

const email = process.env.REAL_PARENT_EMAIL?.trim()
const password = process.env.REAL_PARENT_PASSWORD
const databaseUrl = process.env.DATABASE_URL ?? ''
const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''
const corepackScript = join(dirname(process.execPath), 'node_modules', 'corepack', 'dist', 'corepack.js')
if (!email || !password) throw new Error('REAL_PARENT_EMAIL and REAL_PARENT_PASSWORD are required; credentials were not read')
if (!databaseUrl.includes('127.0.0.1') && !databaseUrl.includes('localhost')) throw new Error('Real acceptance requires a local DATABASE_URL')
if (apiUrl && !apiUrl.includes('127.0.0.1') && !apiUrl.includes('localhost')) throw new Error('Real acceptance requires a local API URL')

try {
  const command = process.platform === 'win32' ? process.execPath : 'corepack'
  const args = process.platform === 'win32'
    ? [corepackScript, 'pnpm', 'exec', 'playwright', 'test', 'e2e/real-acceptance.spec.ts', '--workers=1']
    : ['pnpm', 'exec', 'playwright', 'test', 'e2e/real-acceptance.spec.ts', '--workers=1']
  execFileSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, REAL_PARENT_EMAIL: email, REAL_PARENT_PASSWORD: password },
  })
} finally {
  // Do not write credentials, cookies, or storage state to disk.
}

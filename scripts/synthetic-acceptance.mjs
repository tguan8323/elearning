import { spawn, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

if (!existsSync('.env')) throw new Error('Copy .env.example to .env before running synthetic acceptance')
const localUrl = process.env.DATABASE_URL ?? ''
if (!localUrl.includes('localhost') && !localUrl.includes('127.0.0.1')) throw new Error('Synthetic acceptance requires a local DATABASE_URL')
const env = { ...process.env, SYNTHETIC_FIXTURE: 'true', SYNTHETIC_PARENT_EMAIL: process.env.SYNTHETIC_PARENT_EMAIL ?? 'synthetic@example.test', SYNTHETIC_PARENT_PASSWORD: process.env.SYNTHETIC_PARENT_PASSWORD ?? 'synthetic-local-password-123' }
const corepackScript = join(dirname(process.execPath), 'node_modules', 'corepack', 'dist', 'corepack.js')
const runner = (args, options = {}) => process.platform === 'win32'
  ? execFileSync(process.execPath, [corepackScript, 'pnpm', ...args], options)
  : execFileSync('corepack', ['pnpm', ...args], options)
const spawnRunner = (args) => process.platform === 'win32'
  ? { command: process.execPath, args: [corepackScript, 'pnpm', ...args] }
  : { command: 'corepack', args: ['pnpm', ...args] }
const children = []
const waitFor = async (url, name) => {
  const deadline = Date.now() + 60_000
  let lastError
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
      lastError = new Error(`${name} returned ${response.status}`)
    } catch (error) { lastError = error }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`${name} did not become ready: ${lastError?.message ?? 'unknown error'}`)
}
try {
  execFileSync('docker', ['compose', 'up', '-d', '--wait'], { stdio: 'inherit' })
  runner(['prisma', 'migrate', 'deploy'], { stdio: 'inherit', env })
  runner(['--filter', '@family-english/api', 'build'], { stdio: 'inherit', env })
  runner(['--filter', '@family-english/api', 'fixture:synthetic'], { stdio: 'inherit', env })
  const apiRun = spawnRunner(['--filter', '@family-english/api', 'start'])
  const webRun = spawnRunner(['--filter', '@family-english/web', 'dev'])
  const api = spawn(apiRun.command, apiRun.args, { stdio: 'inherit', env })
  const web = spawn(webRun.command, webRun.args, { stdio: 'inherit', env })
  children.push(api, web)
  await waitFor('http://127.0.0.1:3001/api/health', 'API')
  await waitFor('http://127.0.0.1:3000/login', 'Web')
  runner(['exec', 'playwright', 'test', 'e2e/acceptance.spec.ts', 'e2e/authenticated-synthetic.spec.ts', 'e2e/offline-browser.spec.ts', '--workers=1'], { stdio: 'inherit', env })
} finally {
  for (const child of children) {
    if (process.platform === 'win32' && child.pid) {
      try { execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }) } catch { /* Process already exited. */ }
    } else child.kill()
  }
}

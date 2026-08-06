import { NestFactory } from '@nestjs/core'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

import { AppModule } from './app.module'
import { AuthService } from './auth/auth.service'

async function readHidden(prompt: string) {
  if (!stdin.isTTY || !stdout.isTTY || !stdin.setRawMode) throw new Error('密码重置必须在交互式终端中运行')
  stdout.write(prompt)
  stdin.setRawMode(true)
  stdin.resume()
  stdin.setEncoding('utf8')
  return new Promise<string>((resolve, reject) => {
    let value = ''
    const finish = () => { stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData); stdout.write('\n') }
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\r' || character === '\n') { finish(); resolve(value); return }
        if (character === '') { finish(); reject(new Error('密码重置已取消')); return }
        if (character === '' || character === '\b') value = value.slice(0, -1)
        else value += character
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  if (process.argv.length > 2) throw new Error('请勿通过命令行参数传入账号或密码')
  const readline = createInterface({ input: stdin, output: stdout })
  const email = await readline.question('家长邮箱：')
  readline.close()
  const password = await readHidden('新家长密码（至少 12 个字符）：')
  if (password.length < 12) throw new Error('密码至少需要 12 个字符')
  const confirmation = await readHidden('再次输入新密码：')
  if (password !== confirmation) throw new Error('两次输入的密码不一致')

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  try {
    await app.get(AuthService).resetParentPassword(email, password)
    stdout.write('家长密码已重置，所有旧会话均已撤销。\n')
  } finally { await app.close() }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : '密码重置失败'}\n`)
  process.exitCode = 1
})

import { NestFactory } from '@nestjs/core'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

import { AppModule } from './app.module'
import { AuthService } from './auth/auth.service'

async function readHidden(prompt: string) {
  if (!stdin.isTTY || !stdout.isTTY || !stdin.setRawMode) {
    throw new Error('初始化必须在交互式终端中运行')
  }

  stdout.write(prompt)
  stdin.setRawMode(true)
  stdin.resume()
  stdin.setEncoding('utf8')

  return new Promise<string>((resolve, reject) => {
    let value = ''
    const finish = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      stdout.write('\n')
    }
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\r' || character === '\n') {
          finish()
          resolve(value)
          return
        }
        if (character === '') {
          finish()
          reject(new Error('初始化已取消'))
          return
        }
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
  const password = await readHidden('家长密码（至少 12 个字符）：')
  if (password.length < 12) throw new Error('密码至少需要 12 个字符')

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  try {
    const result = await app.get(AuthService).initializeParent(email, password)
    stdout.write(result.created ? '家长账号初始化成功。\n' : '家长账号已经初始化，未创建第二个账号。\n')
  } finally {
    await app.close()
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '初始化失败'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})

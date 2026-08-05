import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  const configuredOrigins = config.get<string>('WEB_ORIGIN')
  const webOrigins = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

  app.setGlobalPrefix('api')
  app.enableCors({ origin: webOrigins, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

  if (config.get('NODE_ENV', 'development') !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Family English API')
        .setDescription('家庭英语教学网站后端接口')
        .setVersion('0.1.0')
        .build(),
    )
    SwaggerModule.setup('api/docs', app, document)
  }

  await app.listen(config.get<number>('API_PORT', 3001))
}

void bootstrap()

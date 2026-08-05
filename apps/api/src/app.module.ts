import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { LearnersModule } from './learners/learners.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    DatabaseModule,
    AuthModule,
    LearnersModule,
    HealthModule,
  ],
})
export class AppModule {}

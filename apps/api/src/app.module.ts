import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { FamilyContentModule } from './family-content/family-content.module'
import { HealthModule } from './health/health.module'
import { LearningModule } from './learning/learning.module'
import { LearnersModule } from './learners/learners.module'
import { SyncModule } from './sync/sync.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    DatabaseModule,
    AuthModule,
    LearnersModule,
    FamilyContentModule,
    LearningModule,
    SyncModule,
    HealthModule,
  ],
})
export class AppModule {}

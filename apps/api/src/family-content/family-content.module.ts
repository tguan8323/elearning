import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { DatabaseModule } from '../database/database.module'
import { FamilyContentController, LearnerFamilyContentController } from './family-content.controller'
import { FamilyContentService, storageProvider } from './family-content.service'

@Module({ imports: [DatabaseModule, AuthModule], controllers: [FamilyContentController, LearnerFamilyContentController], providers: [FamilyContentService, storageProvider] })
export class FamilyContentModule {}

import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { LearnerHomeController } from './learner-home.controller'
import { LearnersController } from './learners.controller'
import { LearnersService } from './learners.service'
import { ModeController } from './mode.controller'

@Module({
  imports: [AuthModule],
  controllers: [LearnersController, ModeController, LearnerHomeController],
  providers: [LearnersService],
})
export class LearnersModule {}

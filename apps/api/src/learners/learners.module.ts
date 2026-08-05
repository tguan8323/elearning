import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { LearnersController } from './learners.controller'
import { LearnersService } from './learners.service'

@Module({
  imports: [AuthModule],
  controllers: [LearnersController],
  providers: [LearnersService],
})
export class LearnersModule {}

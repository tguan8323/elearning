import { Module } from '@nestjs/common'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

import { ParentSessionService } from './parent-session.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, ParentSessionService],
  exports: [AuthService, ParentSessionService],
})
export class AuthModule {}

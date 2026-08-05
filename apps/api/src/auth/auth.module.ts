import { Module } from '@nestjs/common'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CredentialRateLimitService } from './credential-rate-limit.service'

import { ParentSessionService } from './parent-session.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, ParentSessionService, CredentialRateLimitService],
  exports: [AuthService, ParentSessionService, CredentialRateLimitService],
})
export class AuthModule {}

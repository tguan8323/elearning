import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { HealthResponse, ReadinessResponse } from '@family-english/contracts'

import { ReadinessService } from './readiness.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get()
  @ApiOperation({ summary: 'Check API availability' })
  @ApiOkResponse({
    schema: {
      example: { status: 'ok', service: 'family-english-api' },
      properties: {
        status: { type: 'string', enum: ['ok'] },
        service: { type: 'string', enum: ['family-english-api'] },
      },
    },
  })
  getHealth(): HealthResponse {
    return { status: 'ok', service: 'family-english-api' }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check API dependencies' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ready',
        service: 'family-english-api',
        dependencies: { database: 'connected' },
      },
    },
  })
  getReadiness(): Promise<ReadinessResponse> {
    return this.readiness.check()
  }
}

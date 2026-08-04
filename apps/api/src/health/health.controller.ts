import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

export interface HealthResponse {
  status: 'ok'
  service: 'family-english-api'
}

@ApiTags('health')
@Controller('health')
export class HealthController {
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
}

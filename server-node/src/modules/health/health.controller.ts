import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/response/api-response.dto';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the basic runtime health status of the Node service.',
  })
  @ApiOkResponse({
    description: 'The service is running.',
    schema: {
      example: {
        code: 200,
        message: 'success',
        data: {
          status: 'ok',
          service: 'byyouside-api',
          timestamp: '2026-05-16T15:00:00.000Z',
        },
      },
    },
    type: ApiResponseDto<HealthResponseDto>,
  })
  getHealth(): HealthResponseDto {
    return this.healthService.getHealth();
  }
}

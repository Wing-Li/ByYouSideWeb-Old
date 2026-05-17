import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/response/api-response.dto';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: '获取服务健康状态',
    description:
      '返回 Node.js 后端服务的基础运行状态，用于确认服务是否已经成功启动并可以响应请求。',
  })
  @ApiOkResponse({
    description: '服务正在运行。',
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

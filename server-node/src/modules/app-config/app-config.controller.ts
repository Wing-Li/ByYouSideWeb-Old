import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/response/api-response.dto';
import { AppConfigService } from './app-config.service';
import { AppConfigDto } from './dto/app-config.dto';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';

@ApiTags('App 配置')
@Controller('app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get('app')
  @ApiOperation({
    summary: '查询 App 启动配置',
    description:
      '旧接口映射：GET /config/app。返回最新 App 配置，并附带 VIP 套餐列表。',
  })
  @ApiOkResponse({
    description: 'App 启动配置。',
    type: ApiResponseDto<AppConfigDto>,
  })
  @ApiNotFoundResponse({ description: 'App 还没有基本配置。' })
  getAppConfig(): Promise<AppConfigDto> {
    return this.appConfigService.getAppConfig();
  }

  @Patch('app')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '更新 App 启动配置',
    description:
      '旧接口映射：POST /config/create。仅管理员可创建或更新当前环境的 App 配置。',
  })
  @ApiOkResponse({
    description: 'App 配置已更新。',
    type: ApiResponseDto<AppConfigDto>,
  })
  @ApiForbiddenResponse({ description: '只有管理员才可以操作。' })
  updateAppConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAppConfigDto,
  ): Promise<AppConfigDto> {
    return this.appConfigService.updateAppConfig(user.role, dto);
  }
}

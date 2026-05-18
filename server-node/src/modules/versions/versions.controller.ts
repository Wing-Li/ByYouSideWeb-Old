import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { AppVersionDto } from './dto/app-version.dto';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { VersionsService } from './versions.service';

@ApiTags('版本')
@Controller('versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '发布版本',
    description: '旧接口映射：POST /version/add。仅管理员可发布新版本。',
  })
  @ApiCreatedResponse({
    description: '版本已发布。',
    type: ApiResponseDto<AppVersionDto>,
  })
  @ApiForbiddenResponse({ description: '只有管理员才可以操作。' })
  createVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppVersionDto,
  ): Promise<AppVersionDto> {
    return this.versionsService.createVersion(user.role, dto);
  }

  @Get('latest')
  @ApiOperation({
    summary: '查询最新版本',
    description: '旧接口映射：GET /version/getLast。',
  })
  @ApiOkResponse({
    description: '最新版本。',
    type: ApiResponseDto<AppVersionDto>,
  })
  @ApiNotFoundResponse({ description: '目前没有新版本发布。' })
  getLatestVersion(): Promise<AppVersionDto> {
    return this.versionsService.getLatestVersion();
  }
}

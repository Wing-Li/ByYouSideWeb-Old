import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponseDto,
  PaginatedApiResponseDto,
} from '../../common/response/api-response.dto';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { CreateDeviceSnapshotDto } from './dto/create-device-snapshot.dto';
import { DeviceSnapshotDto } from './dto/device-snapshot.dto';
import { DeviceSnapshotQueryDto } from './dto/device-snapshot-query.dto';
import { DevicesService } from './devices.service';

@ApiTags('设备与位置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('snapshots')
  @ApiOperation({
    summary: '上报当前用户设备状态',
    description:
      '旧接口映射：POST /api/device/add。会新增设备快照，并同步用户表中的最近位置字段。',
  })
  @ApiCreatedResponse({
    description: '设备快照已保存。',
    type: ApiResponseDto<DeviceSnapshotDto>,
  })
  @ApiBadRequestResponse({ description: '请求字段格式不正确。' })
  @ApiUnauthorizedResponse({ description: '未登录或登录已过期。' })
  createSnapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeviceSnapshotDto,
  ): Promise<DeviceSnapshotDto> {
    return this.devicesService.createSnapshot(user.id, dto);
  }

  @Get('me/snapshots')
  @ApiOperation({
    summary: '查询当前用户设备快照历史',
    description: '旧接口映射：GET /api/device/myInfoList。',
  })
  @ApiOkResponse({
    description: '当前用户设备快照历史。',
    type: PaginatedApiResponseDto<DeviceSnapshotDto[]>,
  })
  listMySnapshots(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DeviceSnapshotQueryDto,
  ): Promise<PaginatedApiResponseBody<DeviceSnapshotDto[]>> {
    return this.devicesService.listMySnapshots(user.id, query);
  }

  @Get('me/snapshots/latest')
  @ApiOperation({
    summary: '查询当前用户最新设备快照',
    description: '旧接口映射：GET /api/device/getMyLast。',
  })
  @ApiOkResponse({
    description: '当前用户最新设备快照。',
    type: ApiResponseDto<DeviceSnapshotDto>,
  })
  @ApiNotFoundResponse({ description: '当前用户还没有上传过设备信息。' })
  getMyLatestSnapshot(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeviceSnapshotDto> {
    return this.devicesService.getMyLatestSnapshot(user.id);
  }

  @Get('users/:userId/snapshots')
  @ApiOperation({
    summary: '查询指定好友设备快照历史',
    description:
      '旧接口映射：GET /api/device/getByUserId。新后端出于位置隐私要求，只允许查询已接受好友的设备信息。',
  })
  @ApiOkResponse({
    description: '指定好友设备快照历史。',
    type: PaginatedApiResponseDto<DeviceSnapshotDto[]>,
  })
  @ApiForbiddenResponse({ description: '只能查看好友的设备信息。' })
  @ApiNotFoundResponse({ description: '用户不存在。' })
  listUserSnapshots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Query() query: DeviceSnapshotQueryDto,
  ): Promise<PaginatedApiResponseBody<DeviceSnapshotDto[]>> {
    return this.devicesService.listUserSnapshots(user.id, userId, query);
  }

  @Get('users/:userId/snapshots/latest')
  @ApiOperation({
    summary: '查询指定好友最新设备快照',
    description:
      '旧接口映射：GET /api/device/getLastByUserId。新后端出于位置隐私要求，只允许查询已接受好友的设备信息。',
  })
  @ApiOkResponse({
    description: '指定好友最新设备快照。',
    type: ApiResponseDto<DeviceSnapshotDto>,
  })
  @ApiForbiddenResponse({ description: '只能查看好友的设备信息。' })
  @ApiNotFoundResponse({
    description: '用户不存在或该用户还没有上传过设备信息。',
  })
  getUserLatestSnapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<DeviceSnapshotDto> {
    return this.devicesService.getUserLatestSnapshot(user.id, userId);
  }

  @Post('users/:userId/location-request')
  @ApiOperation({
    summary: '请求好友上报位置',
    description:
      '旧接口映射：POST /api/user/requestLocation。新后端只允许向已接受好友发送请求，当前阶段使用 mock/log 推送。',
  })
  @ApiCreatedResponse({
    description: '位置请求推送已发送。',
    type: ApiResponseDto<string>,
  })
  @ApiForbiddenResponse({ description: '只能请求好友的位置。' })
  @ApiBadRequestResponse({
    description: '未获取到对方的设备信息，无法实时通知对方。',
  })
  requestLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<string> {
    return this.devicesService.requestLocation(user.id, userId);
  }
}

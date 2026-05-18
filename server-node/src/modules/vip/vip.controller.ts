import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponseDto,
  PaginatedApiResponseDto,
} from '../../common/response/api-response.dto';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { BindVipDto } from './dto/bind-vip.dto';
import { CreateVipOrderDto } from './dto/create-vip-order.dto';
import { CreateVipPlanDto } from './dto/create-vip-plan.dto';
import { UpdateVipPlanDto } from './dto/update-vip-plan.dto';
import { VipOrderDto } from './dto/vip-order.dto';
import { VipOrderQueryDto } from './dto/vip-order-query.dto';
import { VipPlanDto } from './dto/vip-plan.dto';
import { VipService } from './vip.service';

@ApiTags('VIP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vip')
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Get('plans')
  @ApiOperation({
    summary: '查询 VIP 套餐',
    description:
      '旧接口映射：GET /api/vip/getType。返回当前可见的 VIP 套餐配置。',
  })
  @ApiOkResponse({
    description: 'VIP 套餐列表。',
    type: ApiResponseDto<VipPlanDto[]>,
  })
  @ApiUnauthorizedResponse({ description: '未登录或登录已过期。' })
  listPlans(): Promise<VipPlanDto[]> {
    return this.vipService.listPlans();
  }

  @Post('plans')
  @ApiOperation({
    summary: '创建 VIP 套餐',
    description: '旧接口映射：POST /api/vip/create。仅管理员可操作。',
  })
  @ApiCreatedResponse({
    description: 'VIP 套餐已创建。',
    type: ApiResponseDto<VipPlanDto>,
  })
  @ApiForbiddenResponse({ description: '只有管理员才可以操作。' })
  createPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVipPlanDto,
  ): Promise<VipPlanDto> {
    return this.vipService.createPlan(user.role, dto);
  }

  @Patch('plans/:id')
  @ApiOperation({
    summary: '更新 VIP 套餐',
    description: '旧接口映射：POST /api/vip/update。仅管理员可操作。',
  })
  @ApiOkResponse({
    description: 'VIP 套餐已更新。',
    type: ApiResponseDto<VipPlanDto>,
  })
  @ApiForbiddenResponse({ description: '只有管理员才可以操作。' })
  @ApiNotFoundResponse({ description: 'VIP 类型不存在。' })
  updatePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateVipPlanDto,
  ): Promise<VipPlanDto> {
    return this.vipService.updatePlan(user.role, id, dto);
  }

  @Post('orders')
  @ApiOperation({
    summary: '开通 VIP',
    description:
      '旧接口映射：POST /api/vip/addRecharge。普通用户只能给自己开通；管理员可指定目标用户或使用 ADMIN 来源。',
  })
  @ApiCreatedResponse({
    description: 'VIP 已开通。',
    type: ApiResponseDto<UserProfileDto>,
  })
  @ApiBadRequestResponse({ description: '金额、套餐或来源不合法。' })
  @ApiForbiddenResponse({ description: '普通用户不能给他人开通 VIP。' })
  @ApiNotFoundResponse({ description: '用户或套餐不存在。' })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVipOrderDto,
  ): Promise<UserProfileDto> {
    return this.vipService.createOrder(user.id, user.role, dto);
  }

  @Get('orders/me')
  @ApiOperation({
    summary: '查询我的 VIP 订单',
    description: '旧接口映射：GET /api/vip/getMyRecharge。',
  })
  @ApiOkResponse({
    description: '我的 VIP 订单。',
    type: PaginatedApiResponseDto<VipOrderDto[]>,
  })
  listMyOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VipOrderQueryDto,
  ): Promise<PaginatedApiResponseBody<VipOrderDto[]>> {
    return this.vipService.listMyOrders(user.id, query);
  }

  @Get('orders')
  @ApiOperation({
    summary: '管理员查询 VIP 订单',
    description:
      '旧接口映射：GET /api/vip/getRechargeAll 和 GET /api/vip/getRechargeByUserId。仅管理员可操作。',
  })
  @ApiOkResponse({
    description: 'VIP 订单列表。',
    type: PaginatedApiResponseDto<VipOrderDto[]>,
  })
  @ApiForbiddenResponse({ description: '只有管理员才可以操作。' })
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VipOrderQueryDto,
  ): Promise<PaginatedApiResponseBody<VipOrderDto[]>> {
    return this.vipService.listOrders(user.role, query);
  }

  @Post('bindings')
  @ApiOperation({
    summary: '绑定双人会员名额',
    description:
      '旧接口映射：POST /api/vip/bindVip。使用当前用户最近一次 VIP 订单对应套餐，为目标用户开通绑定来源 VIP，并扣减当前用户绑定名额。',
  })
  @ApiCreatedResponse({
    description: '绑定已完成。',
    type: ApiResponseDto<UserProfileDto>,
  })
  @ApiBadRequestResponse({
    description: '无绑定名额、名额用完或购买信息异常。',
  })
  @ApiNotFoundResponse({ description: '目标用户不存在。' })
  bindVip(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BindVipDto,
  ): Promise<UserProfileDto> {
    return this.vipService.bindVip(user.id, dto);
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  User,
  UserRole,
  VipOrderSource,
  VipPlan,
  VipPlanStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PushService } from '../../integrations/push/push.service';
import { BusinessException } from '../../common/errors/business-exception';
import {
  COMMON_ERROR_CODES,
  VIP_ERROR_CODES,
} from '../../common/errors/error-codes';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { toUserProfileDto } from '../users/users.mapper';
import { BindVipDto } from './dto/bind-vip.dto';
import { CreateVipOrderDto } from './dto/create-vip-order.dto';
import { CreateVipPlanDto } from './dto/create-vip-plan.dto';
import { UpdateVipPlanDto } from './dto/update-vip-plan.dto';
import { VipOrderDto } from './dto/vip-order.dto';
import { VipOrderQueryDto } from './dto/vip-order-query.dto';
import { VipPlanDto } from './dto/vip-plan.dto';
import { toVipOrderDto, toVipPlanDto } from './vip.mapper';

const VIP_ORDER_INCLUDE = {
  plan: true,
} satisfies Prisma.VipOrderInclude;

@Injectable()
export class VipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async listPlans(): Promise<VipPlanDto[]> {
    const plans = await this.prisma.vipPlan.findMany({
      orderBy: [{ status: 'asc' }, { durationMonths: 'asc' }, { id: 'asc' }],
    });
    return plans.map(toVipPlanDto);
  }

  async createPlan(
    currentUserRole: UserRole,
    dto: CreateVipPlanDto,
  ): Promise<VipPlanDto> {
    this.assertAdmin(currentUserRole);
    const plan = await this.prisma.vipPlan.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        level: dto.level,
        durationMonths: dto.durationMonths,
        price: new Prisma.Decimal(dto.price),
        productCode: dto.productCode,
        status: dto.status,
      },
    });
    return toVipPlanDto(plan);
  }

  async updatePlan(
    currentUserRole: UserRole,
    planId: string,
    dto: UpdateVipPlanDto,
  ): Promise<VipPlanDto> {
    this.assertAdmin(currentUserRole);
    const id = this.parseId(planId);
    await this.findPlanOrThrow(id, VIP_ERROR_CODES.PLAN_NOT_FOUND);

    const plan = await this.prisma.vipPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.durationMonths !== undefined
          ? { durationMonths: dto.durationMonths }
          : {}),
        ...(dto.price !== undefined
          ? { price: new Prisma.Decimal(dto.price) }
          : {}),
        ...(dto.productCode !== undefined
          ? { productCode: dto.productCode }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
    return toVipPlanDto(plan);
  }

  async createOrder(
    currentUserId: bigint,
    currentUserRole: UserRole,
    dto: CreateVipOrderDto,
  ): Promise<UserProfileDto> {
    const targetUserId = dto.toUserId
      ? this.parseId(dto.toUserId)
      : currentUserId;
    if (targetUserId !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      throw new BusinessException(
        VIP_ERROR_CODES.TARGET_USER_FORBIDDEN,
        '普通用户不能给他人开通 VIP',
        HttpStatus.FORBIDDEN,
      );
    }
    if (
      dto.source === VipOrderSource.ADMIN &&
      currentUserRole !== UserRole.ADMIN
    ) {
      this.assertAdmin(currentUserRole);
    }
    if (dto.source === VipOrderSource.BIND) {
      throw new BusinessException(
        VIP_ERROR_CODES.LATEST_ORDER_INVALID,
        '绑定来源只能通过绑定接口创建',
      );
    }
    if (dto.source !== VipOrderSource.ADMIN && dto.amount < 0) {
      throw new BusinessException(
        VIP_ERROR_CODES.AMOUNT_NEGATIVE,
        '金额不能小于0元',
      );
    }

    const plan = await this.findPlanOrThrow(
      this.parseId(dto.planId),
      VIP_ERROR_CODES.PURCHASE_PLAN_NOT_FOUND,
    );
    const user = await this.findUserOrThrow(targetUserId);
    const updated = await this.applyVipOrder({
      user,
      plan,
      source: dto.source,
      amount: new Prisma.Decimal(dto.amount),
      bindFromUserId: null,
    });
    return toUserProfileDto(updated);
  }

  async bindVip(
    currentUserId: bigint,
    dto: BindVipDto,
  ): Promise<UserProfileDto> {
    const toUserId = this.parseId(dto.toUserId);
    if (toUserId === currentUserId) {
      throw new BusinessException(
        VIP_ERROR_CODES.CANNOT_BIND_SELF,
        '不能绑定给自己',
      );
    }

    const [currentUser, targetUser] = await Promise.all([
      this.findUserOrThrow(currentUserId),
      this.findUserOrThrow(toUserId),
    ]);
    if (currentUser.vipBindQuotaTotal <= 0) {
      throw new BusinessException(
        VIP_ERROR_CODES.NO_BIND_QUOTA,
        '您没有可绑定的名额',
      );
    }
    if (currentUser.vipBindQuotaUsed >= currentUser.vipBindQuotaTotal) {
      throw new BusinessException(
        VIP_ERROR_CODES.BIND_QUOTA_USED_UP,
        '您的名额已经用完',
      );
    }

    const latestOrder = await this.prisma.vipOrder.findFirst({
      where: { userId: currentUserId },
      include: VIP_ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    if (!latestOrder) {
      throw new BusinessException(
        VIP_ERROR_CODES.LATEST_ORDER_INVALID,
        '您的购买信息有误，请联系管理员',
      );
    }

    const updatedCurrentUser = await this.prisma.$transaction(async (tx) => {
      await this.applyVipOrderWithClient(tx, {
        user: targetUser,
        plan: latestOrder.plan,
        source: VipOrderSource.BIND,
        amount: new Prisma.Decimal(0),
        bindFromUserId: currentUserId,
      });

      return tx.user.update({
        where: { id: currentUserId },
        data: {
          vipBindQuotaUsed: currentUser.vipBindQuotaUsed + 1,
        },
      });
    });

    this.pushService.sendBindVip({
      deviceType: targetUser.pushDeviceType,
      pushAlias: targetUser.pushAlias,
      pushAliasType: targetUser.pushAliasType,
      fromUserId: currentUser.id,
      fromUserNickname: currentUser.nickname,
      fromUserAvatarUrl: currentUser.avatarUrl,
    });

    return toUserProfileDto(updatedCurrentUser);
  }

  async listMyOrders(
    currentUserId: bigint,
    query: VipOrderQueryDto,
  ): Promise<PaginatedApiResponseBody<VipOrderDto[]>> {
    return this.paginateOrders({
      where: { userId: currentUserId },
      query,
    });
  }

  async listOrders(
    currentUserRole: UserRole,
    query: VipOrderQueryDto,
  ): Promise<PaginatedApiResponseBody<VipOrderDto[]>> {
    this.assertAdmin(currentUserRole);
    return this.paginateOrders({
      where: query.userId ? { userId: this.parseId(query.userId) } : {},
      query,
    });
  }

  private async applyVipOrder(params: {
    user: User;
    plan: VipPlan;
    source: VipOrderSource;
    amount: Prisma.Decimal;
    bindFromUserId: bigint | null;
  }): Promise<User> {
    return this.prisma.$transaction((tx) =>
      this.applyVipOrderWithClient(tx, params),
    );
  }

  private async applyVipOrderWithClient(
    tx: Prisma.TransactionClient,
    params: {
      user: User;
      plan: VipPlan;
      source: VipOrderSource;
      amount: Prisma.Decimal;
      bindFromUserId: bigint | null;
    },
  ): Promise<User> {
    await tx.vipOrder.create({
      data: {
        userId: params.user.id,
        planId: params.plan.id,
        source: params.source,
        amount: params.amount,
        bindFromUserId: params.bindFromUserId,
      },
    });

    const expiresAt = addMonths(
      params.user.vipExpiresAt &&
        params.user.vipExpiresAt.getTime() > Date.now()
        ? params.user.vipExpiresAt
        : new Date(),
      params.plan.durationMonths,
    );

    return tx.user.update({
      where: { id: params.user.id },
      data: {
        vipLevel: params.plan.level,
        vipSource: params.source,
        vipExpiresAt: expiresAt,
        vipBindQuotaTotal:
          params.source === VipOrderSource.BIND
            ? 0
            : params.plan.status === VipPlanStatus.DUET
              ? 1
              : 0,
        vipBindQuotaUsed: 0,
      },
    });
  }

  private async paginateOrders(params: {
    where: Prisma.VipOrderWhereInput;
    query: VipOrderQueryDto;
  }): Promise<PaginatedApiResponseBody<VipOrderDto[]>> {
    const page = params.query.page ?? 1;
    const pageSize = params.query.pageSize ?? 20;
    const [total, orders] = await Promise.all([
      this.prisma.vipOrder.count({ where: params.where }),
      this.prisma.vipOrder.findMany({
        where: params.where,
        include: VIP_ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.ceil(total / pageSize);
    return {
      code: 200,
      message: 'success',
      data: orders.map(toVipOrderDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        isLast: page >= totalPages,
      },
    };
  }

  private async findPlanOrThrow(id: bigint, code: number): Promise<VipPlan> {
    const plan = await this.prisma.vipPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new BusinessException(
        code,
        code === VIP_ERROR_CODES.PLAN_NOT_FOUND
          ? '此VIP类型不存在，请联系管理员'
          : '您购买的VIP套餐已不存在，请联系管理员',
        HttpStatus.NOT_FOUND,
      );
    }
    return plan;
  }

  private async findUserOrThrow(id: bigint): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BusinessException(
        VIP_ERROR_CODES.USER_NOT_FOUND,
        '没有此用户，请确认用户信息',
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  private assertAdmin(role: UserRole): void {
    if (role !== UserRole.ADMIN) {
      throw new BusinessException(
        COMMON_ERROR_CODES.FORBIDDEN,
        '只有管理员才可以操作',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BusinessException(
        VIP_ERROR_CODES.PLAN_NOT_FOUND,
        '请求的 ID 格式不正确',
      );
    }
    return BigInt(value);
  }
}

function addMonths(source: Date, months: number): Date {
  const result = new Date(source.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

import { Prisma, VipOrder, VipPlan } from '@prisma/client';
import { VipOrderDto } from './dto/vip-order.dto';
import { VipPlanDto } from './dto/vip-plan.dto';

export type VipOrderWithPlan = VipOrder & {
  plan: VipPlan;
};

export function toVipPlanDto(plan: VipPlan): VipPlanDto {
  return {
    id: plan.id.toString(),
    name: plan.name,
    description: plan.description,
    level: plan.level,
    durationMonths: plan.durationMonths,
    price: decimalToString(plan.price),
    productCode: plan.productCode,
    status: plan.status,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export function toVipOrderDto(order: VipOrderWithPlan): VipOrderDto {
  return {
    id: order.id.toString(),
    userId: order.userId.toString(),
    plan: toVipPlanDto(order.plan),
    source: order.source,
    bindFromUserId: order.bindFromUserId?.toString() ?? null,
    amount: decimalToString(order.amount),
    createdAt: order.createdAt.toISOString(),
  };
}

function decimalToString(value: Prisma.Decimal): string {
  return value.toString();
}

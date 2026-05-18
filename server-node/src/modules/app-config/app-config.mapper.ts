import { AppConfig, VipPlan } from '@prisma/client';
import { toVipPlanDto } from '../vip/vip.mapper';
import { AppConfigDto } from './dto/app-config.dto';

export function toAppConfigDto(
  config: AppConfig,
  vipPlans: VipPlan[] = [],
): AppConfigDto {
  return {
    id: config.id.toString(),
    environment: config.environment,
    appName: config.appName,
    unCheckMode: config.unCheckMode,
    vipTypeList: vipPlans.map(toVipPlanDto),
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

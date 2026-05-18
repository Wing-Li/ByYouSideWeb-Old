import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VipOrderSource } from '@prisma/client';
import { VipPlanDto } from './vip-plan.dto';

export class VipOrderDto {
  @ApiProperty({ example: '1', description: 'VIP 订单 ID。' })
  id!: string;

  @ApiProperty({ example: '10000', description: '开通 VIP 的用户 ID。' })
  userId!: string;

  @ApiProperty({ type: VipPlanDto, description: '订单对应的 VIP 套餐。' })
  plan!: VipPlanDto;

  @ApiProperty({
    enum: VipOrderSource,
    example: VipOrderSource.IOS,
    description: '订单来源。',
  })
  source!: VipOrderSource;

  @ApiPropertyOptional({
    example: '10001',
    nullable: true,
    description: '绑定来源用户 ID，仅 BIND 来源存在。',
  })
  bindFromUserId!: string | null;

  @ApiProperty({ example: '18.80', description: '实付金额。' })
  amount!: string;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;
}

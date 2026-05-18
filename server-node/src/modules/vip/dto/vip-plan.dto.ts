import { ApiProperty } from '@nestjs/swagger';
import { VipPlanStatus } from '@prisma/client';

export class VipPlanDto {
  @ApiProperty({ example: '1', description: 'VIP 套餐 ID。' })
  id!: string;

  @ApiProperty({ example: '连续包月', description: '套餐名称。' })
  name!: string;

  @ApiProperty({ example: '', description: '套餐说明。' })
  description!: string;

  @ApiProperty({ example: 1, description: 'VIP 等级。' })
  level!: number;

  @ApiProperty({ example: 1, description: '有效期，单位月。' })
  durationMonths!: number;

  @ApiProperty({ example: '18.80', description: '套餐价格。' })
  price!: string;

  @ApiProperty({
    example: 'com.lyl.byyourside.vip.month.1',
    description: '客户端商品标识。',
  })
  productCode!: string;

  @ApiProperty({
    enum: VipPlanStatus,
    example: VipPlanStatus.ACTIVE,
    description: '套餐状态，DUET 表示双人会员套餐。',
  })
  status!: VipPlanStatus;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '更新时间。',
  })
  updatedAt!: string;
}

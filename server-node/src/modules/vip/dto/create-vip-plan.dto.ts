import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VipPlanStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVipPlanDto {
  @ApiProperty({ example: '双人包月', description: '套餐名称。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: '', description: '套餐说明。' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, description: 'VIP 等级。' })
  @IsInt()
  @Min(0)
  level!: number;

  @ApiProperty({ example: 1, description: '有效期，单位月。' })
  @IsInt()
  @Min(1)
  durationMonths!: number;

  @ApiProperty({ example: 28.8, description: '套餐价格。' })
  @Min(0)
  price!: number;

  @ApiProperty({
    example: 'com.lyl.byyourside.vip.month.duet.1',
    description: '客户端商品标识。',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  productCode!: string;

  @ApiProperty({
    enum: VipPlanStatus,
    example: VipPlanStatus.DUET,
    description: '套餐状态。',
  })
  @IsEnum(VipPlanStatus)
  status!: VipPlanStatus;
}

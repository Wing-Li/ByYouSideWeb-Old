import { ApiPropertyOptional } from '@nestjs/swagger';
import { VipPlanStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateVipPlanDto {
  @ApiPropertyOptional({ example: '双人包月', description: '套餐名称。' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: '', description: '套餐说明。' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'VIP 等级。' })
  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number;

  @ApiPropertyOptional({ example: 1, description: '有效期，单位月。' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @ApiPropertyOptional({ example: 28.8, description: '套餐价格。' })
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 'com.lyl.byyourside.vip.month.duet.1',
    description: '客户端商品标识。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  productCode?: string;

  @ApiPropertyOptional({ enum: VipPlanStatus, description: '套餐状态。' })
  @IsOptional()
  @IsEnum(VipPlanStatus)
  status?: VipPlanStatus;
}

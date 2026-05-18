import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VipOrderSource } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateVipOrderDto {
  @ApiProperty({ example: '1', description: 'VIP 套餐 ID。' })
  @IsString()
  @Matches(/^\d+$/)
  planId!: string;

  @ApiProperty({ example: 18.8, description: '实付金额。' })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    enum: VipOrderSource,
    example: VipOrderSource.IOS,
    description: '订单来源。普通用户只能使用 IOS 或 ANDROID。',
  })
  @IsEnum(VipOrderSource)
  source!: VipOrderSource;

  @ApiPropertyOptional({
    example: '10001',
    description: '目标用户 ID；仅管理员可为其他用户开通。',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  toUserId?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VipOrderQueryDto {
  @ApiPropertyOptional({ example: 1, description: '页码，从 1 开始。' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: '每页数量。' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ example: '10000', description: '按用户 ID 过滤。' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  userId?: string;
}

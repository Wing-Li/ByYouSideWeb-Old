import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class MomentQueryDto {
  @ApiProperty({
    example: '1',
    description: '当前用户拥有的已接受好友关系 ID，使用字符串承载 BigInt。',
  })
  @IsString()
  @IsNotEmpty()
  friendRelationId!: string;

  @ApiPropertyOptional({ example: 1, description: '页码，从 1 开始。' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: '每页数量。' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

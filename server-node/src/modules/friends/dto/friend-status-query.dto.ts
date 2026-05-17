import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FriendStatus } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

function toStatusArray(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim());
  }
  return [value];
}

export class FriendStatusQueryDto {
  @ApiPropertyOptional({
    enum: FriendStatus,
    isArray: true,
    description: '可选状态过滤；不传时使用接口默认状态集合。',
  })
  @IsOptional()
  @Transform(({ value }) => toStatusArray(value))
  @IsArray()
  @IsEnum(FriendStatus, { each: true })
  status?: FriendStatus[];

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

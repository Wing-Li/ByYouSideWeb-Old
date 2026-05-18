import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateMomentDto {
  @ApiPropertyOptional({
    example: '今天的晚霞很好看，想第一时间分享给你。',
    description: '瞬间内容。',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    example: '2026-05-18T12:00:00.000Z',
    description: '发生时间。',
  })
  @IsOptional()
  @IsDateString()
  happenedAt?: string;
}

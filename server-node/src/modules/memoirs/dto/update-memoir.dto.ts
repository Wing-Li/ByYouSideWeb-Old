import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMemoirDto {
  @ApiPropertyOptional({ example: '第一次一起看海', description: '回忆标题。' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    example: '那天风很大，但我们都笑得很开心。',
    description: '回忆内容。',
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

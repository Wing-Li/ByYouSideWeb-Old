import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMemoirDto {
  @ApiProperty({
    example: '1',
    description: '当前用户拥有的已接受好友关系 ID，使用字符串承载 BigInt。',
  })
  @IsString()
  @IsNotEmpty()
  friendRelationId!: string;

  @ApiProperty({ example: '第一次一起看海', description: '回忆标题。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({
    example: '那天风很大，但我们都笑得很开心。',
    description: '回忆内容。',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    example: '2026-05-18T12:00:00.000Z',
    description: '发生时间，未传时使用当前时间。',
  })
  @IsOptional()
  @IsDateString()
  happenedAt?: string;
}

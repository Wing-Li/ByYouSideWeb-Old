import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMomentDto {
  @ApiProperty({
    example: '1',
    description: '当前用户拥有的已接受好友关系 ID，使用字符串承载 BigInt。',
  })
  @IsString()
  @IsNotEmpty()
  friendRelationId!: string;

  @ApiProperty({
    example: '今天的晚霞很好看，想第一时间分享给你。',
    description: '瞬间内容。',
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

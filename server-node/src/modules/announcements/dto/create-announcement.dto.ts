import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: '系统维护通知', description: '公告标题。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: '管理员', description: '作者展示名。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  authorName?: string;

  @ApiProperty({
    example: '今晚 23:00 进行系统维护。',
    description: '公告内容。',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

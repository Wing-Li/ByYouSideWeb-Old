import { ApiProperty } from '@nestjs/swagger';

export class AnnouncementDto {
  @ApiProperty({ example: '1', description: '公告 ID。' })
  id!: string;

  @ApiProperty({ example: '1', description: '发布管理员用户 ID。' })
  authorId!: string;

  @ApiProperty({ example: '系统维护通知', description: '公告标题。' })
  title!: string;

  @ApiProperty({ example: '管理员', description: '作者展示名。' })
  authorName!: string;

  @ApiProperty({
    example: '今晚 23:00 进行系统维护。',
    description: '公告内容。',
  })
  content!: string;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '更新时间。',
  })
  updatedAt!: string;
}

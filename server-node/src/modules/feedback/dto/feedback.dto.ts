import { ApiProperty } from '@nestjs/swagger';

export class FeedbackDto {
  @ApiProperty({ example: '1', description: '反馈 ID。' })
  id!: string;

  @ApiProperty({ example: '1', description: '提交用户 ID。' })
  userId!: string;

  @ApiProperty({ example: '希望增加夜间模式。', description: '反馈内容。' })
  content!: string;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '提交时间。',
  })
  createdAt!: string;
}

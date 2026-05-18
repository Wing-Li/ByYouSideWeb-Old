import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../users/dto/user-profile.dto';

export class MemoirDto {
  @ApiProperty({
    example: '1',
    description: '回忆录 ID，使用字符串承载 BigInt。',
  })
  id!: string;

  @ApiProperty({ example: '1', description: '好友关系 ID。' })
  friendRelationId!: string;

  @ApiProperty({ example: '1', description: '作者用户 ID。' })
  authorId!: string;

  @ApiProperty({ type: UserProfileDto, description: '作者资料。' })
  author!: UserProfileDto;

  @ApiProperty({ example: '第一次一起看海', description: '回忆标题。' })
  title!: string;

  @ApiProperty({
    example: '那天风很大，但我们都笑得很开心。',
    description: '回忆内容。',
  })
  content!: string;

  @ApiProperty({
    example: '2026-05-18T12:00:00.000Z',
    description: '发生时间。',
  })
  happenedAt!: string;

  @ApiProperty({
    example: '2026-05-18T12:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-18T12:00:00.000Z',
    description: '更新时间。',
  })
  updatedAt!: string;
}

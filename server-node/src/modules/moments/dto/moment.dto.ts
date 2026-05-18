import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../users/dto/user-profile.dto';

export class MomentDto {
  @ApiProperty({
    example: '1',
    description: '瞬间 ID，使用字符串承载 BigInt。',
  })
  id!: string;

  @ApiProperty({ example: '1', description: '好友关系 ID。' })
  friendRelationId!: string;

  @ApiProperty({ example: '1', description: '作者用户 ID。' })
  authorId!: string;

  @ApiProperty({ type: UserProfileDto, description: '作者资料。' })
  author!: UserProfileDto;

  @ApiProperty({
    example: '今天的晚霞很好看，想第一时间分享给你。',
    description: '瞬间内容。',
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

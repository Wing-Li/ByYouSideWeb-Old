import { ApiProperty } from '@nestjs/swagger';
import { FriendBlockState, FriendStatus } from '@prisma/client';
import { UserProfileDto } from '../../users/dto/user-profile.dto';

export class FriendRelationDto {
  @ApiProperty({
    example: '10000',
    description: '好友关系 ID，使用字符串承载 BigInt。',
  })
  id!: string;

  @ApiProperty({
    example: '10001',
    description: '当前记录的发起用户 ID。',
  })
  requesterId!: string;

  @ApiProperty({
    example: '10002',
    description: '当前记录的接收用户 ID。',
  })
  receiverId!: string;

  @ApiProperty({ example: '', description: '发起方对接收方的备注。' })
  requesterAlias!: string;

  @ApiProperty({ example: '', description: '接收方对发起方的备注。' })
  receiverAlias!: string;

  @ApiProperty({
    example: false,
    description: '是否为当前用户绑定的亲密好友。',
  })
  isBestFriend!: boolean;

  @ApiProperty({
    enum: FriendStatus,
    example: FriendStatus.ACCEPTED,
    description: '好友关系状态。',
  })
  status!: FriendStatus;

  @ApiProperty({
    enum: FriendBlockState,
    example: FriendBlockState.NORMAL,
    description: '好友拉黑状态。',
  })
  blockState!: FriendBlockState;

  @ApiProperty({
    type: UserProfileDto,
    description: '当前关系记录的对方用户资料。',
  })
  friend!: UserProfileDto;

  @ApiProperty({
    example: '2026-05-17T00:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-17T00:00:00.000Z',
    description: '更新时间。',
  })
  updatedAt!: string;
}

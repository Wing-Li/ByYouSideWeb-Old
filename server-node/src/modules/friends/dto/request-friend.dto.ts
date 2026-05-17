import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RequestFriendDto {
  @ApiProperty({
    example: '10002',
    description: '被请求添加为好友的用户 ID。',
  })
  @IsString()
  @Matches(/^\d+$/)
  toUserId!: string;
}

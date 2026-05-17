import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateFriendBlockDto {
  @ApiProperty({ example: true, description: '是否拉黑好友。' })
  @IsBoolean()
  isBlock!: boolean;
}

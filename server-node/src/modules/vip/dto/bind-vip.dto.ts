import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class BindVipDto {
  @ApiProperty({ example: '10001', description: '被绑定开通 VIP 的用户 ID。' })
  @IsString()
  @Matches(/^\d+$/)
  toUserId!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateFriendAliasDto {
  @ApiProperty({ example: '小艾', description: '好友备注，1-8 个字符。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  friendAlias!: string;
}

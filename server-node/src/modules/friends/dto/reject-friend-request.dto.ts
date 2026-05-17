import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class RejectFriendRequestDto {
  @ApiPropertyOptional({
    example: false,
    description: '是否永久拒绝。永久拒绝后，对方再次申请会被拒绝。',
  })
  @IsOptional()
  @IsBoolean()
  isPermanentRefusal?: boolean;
}

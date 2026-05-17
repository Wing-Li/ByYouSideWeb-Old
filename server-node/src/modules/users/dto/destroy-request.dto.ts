import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DestroyRequestDto {
  @ApiProperty({ example: '不再使用账号', description: '注销原因。' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  destroyReason!: string;
}

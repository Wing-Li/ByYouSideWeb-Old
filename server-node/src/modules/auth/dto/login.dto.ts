import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'alice_01', description: '用户名或邮箱。' })
  @IsString()
  @MinLength(1)
  usernameOrEmail!: string;

  @ApiProperty({ example: 'ChangeMe_123456', description: '密码。' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  password!: string;
}

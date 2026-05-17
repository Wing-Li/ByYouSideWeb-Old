import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PasswordResetConfirmDto {
  @ApiPropertyOptional({
    example: 'alice_01',
    description: '用户名；与邮箱二选一。',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  username?: string;

  @ApiPropertyOptional({
    example: 'alice@example.com',
    description: '邮箱；与用户名二选一。',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'ChangeMe_654321', description: '新密码，6-32 位。' })
  @MinLength(6)
  @MaxLength(32)
  password!: string;

  @ApiProperty({ example: '1234', description: '4 位邮箱验证码。' })
  @IsString()
  @Length(4, 4)
  verifyCode!: string;
}

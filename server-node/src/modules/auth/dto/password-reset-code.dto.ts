import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class PasswordResetCodeDto {
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
}

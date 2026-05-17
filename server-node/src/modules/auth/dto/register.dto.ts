import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches, MaxLength, MinLength } from 'class-validator';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;

export class RegisterDto {
  @ApiProperty({
    example: 'alice_01',
    description: '4-20 位字母、数字或下划线。',
  })
  @Matches(USERNAME_REGEX)
  username!: string;

  @ApiProperty({ example: 'ChangeMe_123456', description: '6-32 位密码。' })
  @MinLength(6)
  @MaxLength(32)
  password!: string;

  @ApiProperty({ example: 'alice@example.com', description: '邮箱。' })
  @IsEmail()
  email!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../users/dto/user-profile.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '标准 JWT access token。',
  })
  token!: string;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}

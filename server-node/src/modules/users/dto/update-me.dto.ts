import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: '小艾', maxLength: 8, description: '昵称。' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  nickname?: string;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.FEMALE,
    description: '性别。',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    description: '头像地址。',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: '正在迁移到新后端。',
    maxLength: 200,
    description: '简介。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @ApiPropertyOptional({
    example: '1998-05-01T00:00:00.000Z',
    description: '生日。',
  })
  @IsOptional()
  @IsISO8601()
  birthday?: string;

  @ApiPropertyOptional({ example: 'alice@example.com', description: '邮箱。' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 120,
    minimum: 1,
    maximum: 10080,
    description: '设备信息上传间隔，单位分钟。',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  uploadIntervalMinutes?: number;

  @ApiPropertyOptional({ example: 'ios', description: '推送设备类型。' })
  @IsOptional()
  @IsString()
  pushDeviceType?: string;

  @ApiPropertyOptional({
    example: 'push_normal',
    description: '推送别名类型。',
  })
  @IsOptional()
  @IsString()
  pushAliasType?: string;

  @ApiPropertyOptional({ example: 'device-token', description: '推送别名。' })
  @IsOptional()
  @IsString()
  pushAlias?: string;
}

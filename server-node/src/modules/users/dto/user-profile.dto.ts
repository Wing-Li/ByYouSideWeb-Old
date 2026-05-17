import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, UserRole, UserStatus, VipOrderSource } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({
    example: '10000',
    description: '用户 ID，使用字符串承载 BigInt。',
  })
  id!: string;

  @ApiProperty({ example: 'alice_01', description: '用户名。' })
  username!: string;

  @ApiProperty({ example: 'alice@example.com', description: '邮箱。' })
  email!: string;

  @ApiProperty({ example: '小艾', description: '昵称。' })
  nickname!: string;

  @ApiProperty({ example: '', description: '头像地址。' })
  avatarUrl!: string;

  @ApiProperty({ enum: Gender, example: Gender.UNKNOWN, description: '性别。' })
  gender!: Gender;

  @ApiProperty({ example: '', description: '个人简介。' })
  bio!: string;

  @ApiPropertyOptional({
    example: '1998-05-01T00:00:00.000Z',
    description: '生日，ISO 日期字符串。',
    nullable: true,
  })
  birthday!: string | null;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: '用户角色。',
  })
  role!: UserRole;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: '账号状态。',
  })
  status!: UserStatus;

  @ApiProperty({ example: 120, description: '设备信息上传间隔，单位分钟。' })
  uploadIntervalMinutes!: number;

  @ApiProperty({ example: 0, description: 'VIP 等级。' })
  vipLevel!: number;

  @ApiPropertyOptional({
    enum: VipOrderSource,
    nullable: true,
    description: 'VIP 来源。',
  })
  vipSource!: VipOrderSource | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'VIP 到期时间。',
  })
  vipExpiresAt!: string | null;

  @ApiProperty({ example: 0, description: 'VIP 绑定名额总数。' })
  vipBindQuotaTotal!: number;

  @ApiProperty({ example: 0, description: 'VIP 已使用绑定名额。' })
  vipBindQuotaUsed!: number;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: '注销申请时间。',
  })
  destroyRequestedAt!: string | null;

  @ApiProperty({ example: '', description: '最近位置地址。' })
  lastLocationAddress!: string;

  @ApiProperty({ example: '0', description: '最近位置经度。' })
  lastLocationLongitude!: string;

  @ApiProperty({ example: '0', description: '最近位置纬度。' })
  lastLocationLatitude!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: '最近位置上报时间。',
  })
  lastLocationAt!: string | null;

  @ApiPropertyOptional({
    example: 'ios',
    nullable: true,
    description: '推送设备类型。',
  })
  pushDeviceType!: string | null;

  @ApiPropertyOptional({
    example: 'push_normal',
    nullable: true,
    description: '推送别名类型。',
  })
  pushAliasType!: string | null;

  @ApiPropertyOptional({
    example: 'device-token',
    nullable: true,
    description: '推送别名。',
  })
  pushAlias!: string | null;

  @ApiProperty({
    example: '2026-05-17T00:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-17T00:00:00.000Z',
    description: '更新时间。',
  })
  updatedAt!: string;
}

import { Prisma, User } from '@prisma/client';
import { UserProfileDto } from './dto/user-profile.dto';

type UserProfileSource = Pick<
  User,
  | 'id'
  | 'username'
  | 'email'
  | 'nickname'
  | 'avatarUrl'
  | 'gender'
  | 'bio'
  | 'birthday'
  | 'role'
  | 'status'
  | 'uploadIntervalMinutes'
  | 'vipLevel'
  | 'vipSource'
  | 'vipExpiresAt'
  | 'vipBindQuotaTotal'
  | 'vipBindQuotaUsed'
  | 'destroyRequestedAt'
  | 'lastLocationAddress'
  | 'lastLocationLongitude'
  | 'lastLocationLatitude'
  | 'lastLocationAt'
  | 'pushDeviceType'
  | 'pushAliasType'
  | 'pushAlias'
  | 'createdAt'
  | 'updatedAt'
>;

export function toUserProfileDto(user: UserProfileSource): UserProfileDto {
  return {
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    gender: user.gender,
    bio: user.bio,
    birthday: user.birthday?.toISOString() ?? null,
    role: user.role,
    status: user.status,
    uploadIntervalMinutes: user.uploadIntervalMinutes,
    vipLevel: user.vipLevel,
    vipSource: user.vipSource,
    vipExpiresAt: user.vipExpiresAt?.toISOString() ?? null,
    vipBindQuotaTotal: user.vipBindQuotaTotal,
    vipBindQuotaUsed: user.vipBindQuotaUsed,
    destroyRequestedAt: user.destroyRequestedAt?.toISOString() ?? null,
    lastLocationAddress: user.lastLocationAddress,
    lastLocationLongitude: decimalToString(user.lastLocationLongitude),
    lastLocationLatitude: decimalToString(user.lastLocationLatitude),
    lastLocationAt: user.lastLocationAt?.toISOString() ?? null,
    pushDeviceType: user.pushDeviceType,
    pushAliasType: user.pushAliasType,
    pushAlias: user.pushAlias,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function decimalToString(value: Prisma.Decimal): string {
  return value.toString();
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { FriendStatus, Prisma, User, UserStatus } from '@prisma/client';
import { BusinessException } from '../../common/errors/business-exception';
import { DEVICE_ERROR_CODES } from '../../common/errors/error-codes';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { PrismaService } from '../../database/prisma.service';
import { PushService } from '../../integrations/push/push.service';
import { CreateDeviceSnapshotDto } from './dto/create-device-snapshot.dto';
import { DeviceSnapshotDto } from './dto/device-snapshot.dto';
import { DeviceSnapshotQueryDto } from './dto/device-snapshot-query.dto';
import { toDeviceSnapshotDto } from './devices.mapper';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async createSnapshot(
    currentUserId: bigint,
    dto: CreateDeviceSnapshotDto,
  ): Promise<DeviceSnapshotDto> {
    await this.findActiveUser(currentUserId);

    const snapshot = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deviceSnapshot.create({
        data: {
          userId: currentUserId,
          ...this.toSnapshotCreateData(dto),
        },
      });

      await tx.user.update({
        where: { id: currentUserId },
        data: {
          ...(dto.locationAddress !== undefined
            ? { lastLocationAddress: dto.locationAddress }
            : {}),
          ...(dto.locationLongitude !== undefined
            ? {
                lastLocationLongitude: new Prisma.Decimal(
                  dto.locationLongitude,
                ),
              }
            : {}),
          ...(dto.locationLatitude !== undefined
            ? { lastLocationLatitude: new Prisma.Decimal(dto.locationLatitude) }
            : {}),
          lastLocationAt: created.createdAt,
        },
      });

      return created;
    });

    return toDeviceSnapshotDto(snapshot);
  }

  listMySnapshots(
    currentUserId: bigint,
    query: DeviceSnapshotQueryDto,
  ): Promise<PaginatedApiResponseBody<DeviceSnapshotDto[]>> {
    return this.listSnapshots(currentUserId, query);
  }

  async listUserSnapshots(
    currentUserId: bigint,
    targetUserIdValue: string,
    query: DeviceSnapshotQueryDto,
  ): Promise<PaginatedApiResponseBody<DeviceSnapshotDto[]>> {
    const targetUserId = this.parseId(targetUserIdValue);
    await this.assertCanAccessTargetUser(currentUserId, targetUserId);
    return this.listSnapshots(targetUserId, query);
  }

  async getMyLatestSnapshot(currentUserId: bigint): Promise<DeviceSnapshotDto> {
    return this.getLatestSnapshot(currentUserId);
  }

  async getUserLatestSnapshot(
    currentUserId: bigint,
    targetUserIdValue: string,
  ): Promise<DeviceSnapshotDto> {
    const targetUserId = this.parseId(targetUserIdValue);
    await this.assertCanAccessTargetUser(currentUserId, targetUserId);
    return this.getLatestSnapshot(targetUserId);
  }

  async requestLocation(
    currentUserId: bigint,
    targetUserIdValue: string,
  ): Promise<string> {
    const targetUserId = this.parseId(targetUserIdValue);
    const [currentUser, targetUser] = await Promise.all([
      this.findActiveUser(currentUserId),
      this.assertCanAccessTargetUser(currentUserId, targetUserId),
    ]);

    if (
      !targetUser.pushDeviceType ||
      !targetUser.pushAlias ||
      !targetUser.pushAliasType
    ) {
      throw new BusinessException(
        DEVICE_ERROR_CODES.PUSH_DEVICE_NOT_FOUND,
        '未获取到对方的设备信息，无法实时通知对方',
      );
    }

    this.pushService.sendRequestLocation({
      deviceType: targetUser.pushDeviceType,
      pushAlias: targetUser.pushAlias,
      pushAliasType: targetUser.pushAliasType,
      fromUserId: currentUser.id,
      fromUserNickname: currentUser.nickname,
      fromUserAvatarUrl: currentUser.avatarUrl,
    });

    return '通知发送成功';
  }

  private async listSnapshots(
    userId: bigint,
    query: DeviceSnapshotQueryDto,
  ): Promise<PaginatedApiResponseBody<DeviceSnapshotDto[]>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { userId };
    const [total, snapshots] = await Promise.all([
      this.prisma.deviceSnapshot.count({ where }),
      this.prisma.deviceSnapshot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.ceil(total / pageSize);

    return {
      code: 200,
      message: 'success',
      data: snapshots.map(toDeviceSnapshotDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        isLast: page >= totalPages,
      },
    };
  }

  private async getLatestSnapshot(userId: bigint): Promise<DeviceSnapshotDto> {
    const snapshot = await this.prisma.deviceSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!snapshot) {
      throw new BusinessException(
        DEVICE_ERROR_CODES.SNAPSHOT_NOT_FOUND,
        '该用户还没有上传过信息',
        HttpStatus.NOT_FOUND,
      );
    }
    return toDeviceSnapshotDto(snapshot);
  }

  private async assertCanAccessTargetUser(
    currentUserId: bigint,
    targetUserId: bigint,
  ): Promise<User> {
    const targetUser = await this.findActiveUser(targetUserId);
    if (currentUserId === targetUserId) {
      return targetUser;
    }

    const relation = await this.prisma.friendRelation.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: currentUserId,
          receiverId: targetUserId,
        },
      },
    });
    if (!relation || relation.status !== FriendStatus.ACCEPTED) {
      throw new BusinessException(
        DEVICE_ERROR_CODES.FRIEND_PERMISSION_REQUIRED,
        '只能查看好友的设备信息',
        HttpStatus.FORBIDDEN,
      );
    }

    return targetUser;
  }

  private async findActiveUser(userId: bigint): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE || user.disabledDays > 0) {
      throw new BusinessException(
        DEVICE_ERROR_CODES.USER_NOT_FOUND,
        '没有此用户，请确认用户信息',
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  private toSnapshotCreateData(
    dto: CreateDeviceSnapshotDto,
  ): Omit<Prisma.DeviceSnapshotUncheckedCreateInput, 'userId'> {
    return {
      deviceName: dto.deviceName,
      screenStatus: dto.screenStatus,
      screenLevel: dto.screenLevel,
      batteryStatus: dto.batteryStatus,
      batteryLevel: dto.batteryLevel,
      volumeLevel: dto.volumeLevel,
      bluetoothStatus: dto.bluetoothStatus,
      bluetoothName: dto.bluetoothName,
      wifiStatus: dto.wifiStatus,
      wifiName: dto.wifiName,
      gpsStatus: dto.gpsStatus,
      locationSource: dto.locationSource,
      locationAddress: dto.locationAddress,
      locationLongitude:
        dto.locationLongitude === undefined
          ? undefined
          : new Prisma.Decimal(dto.locationLongitude),
      locationLatitude:
        dto.locationLatitude === undefined
          ? undefined
          : new Prisma.Decimal(dto.locationLatitude),
    };
  }

  private parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BusinessException(
        DEVICE_ERROR_CODES.USER_NOT_FOUND,
        '没有此用户，请确认用户信息',
        HttpStatus.NOT_FOUND,
      );
    }
    return BigInt(value);
  }
}

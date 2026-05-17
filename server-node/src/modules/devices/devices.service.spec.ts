import {
  FriendBlockState,
  FriendStatus,
  Gender,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PushService } from '../../integrations/push/push.service';
import { DevicesService } from './devices.service';

function createUser(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-17T00:00:00.000Z');
  return {
    id: 1n,
    username: 'alice_01',
    email: 'alice@example.com',
    passwordHash: 'hash',
    nickname: '小艾',
    avatarUrl: '',
    gender: Gender.UNKNOWN,
    bio: '',
    birthday: null,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    disabledDays: 0,
    uploadIntervalMinutes: 120,
    vipLevel: 0,
    vipSource: null,
    vipExpiresAt: null,
    vipBindQuotaTotal: 0,
    vipBindQuotaUsed: 0,
    destroyRequestedAt: null,
    destroyReason: null,
    lastLocationAddress: '',
    lastLocationLongitude: new Prisma.Decimal(0),
    lastLocationLatitude: new Prisma.Decimal(0),
    lastLocationAt: null,
    pushDeviceType: null,
    pushAliasType: null,
    pushAlias: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
    userId: 1n,
    deviceName: 'iPhone',
    screenStatus: 'on',
    screenLevel: '80',
    batteryStatus: 'charging',
    batteryLevel: '76',
    volumeLevel: '40',
    bluetoothStatus: 'on',
    bluetoothName: 'AirPods',
    wifiStatus: 'on',
    wifiName: 'Home WiFi',
    gpsStatus: 'enabled',
    locationSource: 'gps',
    locationAddress: '北京市朝阳区',
    locationLongitude: new Prisma.Decimal('116.4074'),
    locationLatitude: new Prisma.Decimal('39.9042'),
    createdAt: new Date('2026-05-17T00:00:00.000Z'),
    ...overrides,
  };
}

describe('DevicesService', () => {
  it('上报设备快照时会同步用户最近位置', async () => {
    const user = createUser();
    const snapshot = createSnapshot();
    let createdUserId: bigint | null = null;
    let createdDeviceName: string | undefined;
    let updatedUserId: bigint | null = null;
    let updatedLastLocationAddress: string | undefined;
    let updatedLastLocationAt: Date | undefined;
    const tx = {
      deviceSnapshot: {
        create: jest.fn(
          (args: { data: { userId: bigint; deviceName?: string } }) => {
            createdUserId = args.data.userId;
            createdDeviceName = args.data.deviceName;
            return snapshot;
          },
        ),
      },
      user: {
        update: jest.fn(
          (args: {
            where: { id: bigint };
            data: { lastLocationAddress?: string; lastLocationAt?: Date };
          }) => {
            updatedUserId = args.where.id;
            updatedLastLocationAddress = args.data.lastLocationAddress;
            updatedLastLocationAt = args.data.lastLocationAt;
            return user;
          },
        ),
      },
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new DevicesService(prisma as never, {} as PushService);

    const result = await service.createSnapshot(1n, {
      deviceName: 'iPhone',
      locationAddress: '北京市朝阳区',
      locationLongitude: 116.4074,
      locationLatitude: 39.9042,
    });

    expect(result.locationAddress).toBe('北京市朝阳区');
    expect(createdUserId).toBe(1n);
    expect(createdDeviceName).toBe('iPhone');
    expect(updatedUserId).toBe(1n);
    expect(updatedLastLocationAddress).toBe('北京市朝阳区');
    expect(updatedLastLocationAt).toBe(snapshot.createdAt);
  });

  it('非好友查询指定用户设备时会返回权限错误', async () => {
    const alice = createUser({ id: 1n });
    const bob = createUser({ id: 2n });
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValueOnce(bob),
      },
      friendRelation: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new DevicesService(prisma as never, {} as PushService);

    await expect(
      service.listUserSnapshots(alice.id, bob.id.toString(), {}),
    ).rejects.toMatchObject({ response: { code: 14004 } });
  });

  it('请求好友位置时会调用请求位置推送', async () => {
    const alice = createUser({ id: 1n });
    const bob = createUser({
      id: 2n,
      pushDeviceType: 'ios',
      pushAliasType: 'push_normal',
      pushAlias: 'bob-device',
    });
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(alice)
          .mockResolvedValueOnce(bob),
      },
      friendRelation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          requesterId: alice.id,
          receiverId: bob.id,
          requesterAlias: '',
          receiverAlias: '',
          isBestFriend: false,
          status: FriendStatus.ACCEPTED,
          blockState: FriendBlockState.NORMAL,
          createdAt: new Date('2026-05-17T00:00:00.000Z'),
          updatedAt: new Date('2026-05-17T00:00:00.000Z'),
        }),
      },
    };
    const sendRequestLocation = jest.fn();
    const pushService = {
      sendRequestLocation,
    } as unknown as PushService;
    const service = new DevicesService(prisma as never, pushService);

    const result = await service.requestLocation(alice.id, bob.id.toString());

    expect(result).toBe('通知发送成功');
    expect(sendRequestLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceType: 'ios',
        pushAlias: 'bob-device',
        fromUserId: alice.id,
      }),
    );
  });
});

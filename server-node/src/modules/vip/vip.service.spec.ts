import {
  Gender,
  Prisma,
  UserRole,
  UserStatus,
  VipOrderSource,
  VipPlanStatus,
} from '@prisma/client';
import { PushService } from '../../integrations/push/push.service';
import { VipService } from './vip.service';

function createUser(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-18T00:00:00.000Z');
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

function createPlan(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-18T00:00:00.000Z');
  return {
    id: 1n,
    name: '双人包月',
    description: '',
    level: 1,
    durationMonths: 1,
    price: new Prisma.Decimal('28.80'),
    productCode: 'com.lyl.byyourside.vip.month.duet.1',
    status: VipPlanStatus.DUET,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('VipService', () => {
  it('开通双人 VIP 时会创建订单并设置绑定名额', async () => {
    const user = createUser();
    const plan = createPlan();
    const updatedUser = {
      ...user,
      vipLevel: 1,
      vipSource: VipOrderSource.IOS,
      vipBindQuotaTotal: 1,
      vipBindQuotaUsed: 0,
      vipExpiresAt: new Date('2026-06-18T00:00:00.000Z'),
    };
    let createdOrderData:
      | {
          userId: bigint;
          planId: bigint;
          source: VipOrderSource;
        }
      | undefined;
    let updatedUserData:
      | {
          vipLevel?: number;
          vipSource?: VipOrderSource;
          vipBindQuotaTotal?: number;
          vipBindQuotaUsed?: number;
        }
      | undefined;
    const tx = {
      vipOrder: {
        create: jest.fn(
          (args: {
            data: {
              userId: bigint;
              planId: bigint;
              source: VipOrderSource;
            };
          }) => {
            createdOrderData = args.data;
            return {};
          },
        ),
      },
      user: {
        update: jest.fn(
          (args: {
            data: {
              vipLevel?: number;
              vipSource?: VipOrderSource;
              vipBindQuotaTotal?: number;
              vipBindQuotaUsed?: number;
            };
          }) => {
            updatedUserData = args.data;
            return updatedUser;
          },
        ),
      },
    };
    const prisma = {
      vipPlan: {
        findUnique: jest.fn().mockResolvedValue(plan),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new VipService(prisma as never, {} as PushService);

    const result = await service.createOrder(user.id, UserRole.USER, {
      planId: plan.id.toString(),
      amount: 28.8,
      source: VipOrderSource.IOS,
    });

    expect(result.vipBindQuotaTotal).toBe(1);
    expect(createdOrderData).toMatchObject({
      userId: user.id,
      planId: plan.id,
      source: VipOrderSource.IOS,
    });
    expect(updatedUserData).toMatchObject({
      vipLevel: 1,
      vipSource: VipOrderSource.IOS,
      vipBindQuotaTotal: 1,
      vipBindQuotaUsed: 0,
    });
  });

  it('普通用户不能给其他用户开通 VIP', async () => {
    const service = new VipService({} as never, {} as PushService);

    await expect(
      service.createOrder(1n, UserRole.USER, {
        planId: '1',
        amount: 18.8,
        source: VipOrderSource.IOS,
        toUserId: '2',
      }),
    ).rejects.toMatchObject({ response: { code: 17009 } });
  });

  it('绑定 VIP 会给目标用户开通绑定来源订单并扣减名额', async () => {
    const currentUser = createUser({
      id: 1n,
      vipBindQuotaTotal: 1,
      vipBindQuotaUsed: 0,
    });
    const targetUser = createUser({
      id: 2n,
      username: 'bob_01',
      email: 'bob@example.com',
      pushDeviceType: 'ios',
      pushAliasType: 'push_normal',
      pushAlias: 'bob-device',
    });
    const plan = createPlan();
    const updatedCurrentUser = {
      ...currentUser,
      vipBindQuotaUsed: 1,
    };
    let bindOrderData:
      | {
          userId: bigint;
          source: VipOrderSource;
          bindFromUserId: bigint | null;
        }
      | undefined;
    const updateUser = jest
      .fn()
      .mockResolvedValueOnce({
        ...targetUser,
        vipSource: VipOrderSource.BIND,
      })
      .mockResolvedValueOnce(updatedCurrentUser);
    const tx = {
      vipOrder: {
        create: jest.fn(
          (args: {
            data: {
              userId: bigint;
              source: VipOrderSource;
              bindFromUserId: bigint | null;
            };
          }) => {
            bindOrderData = args.data;
            return {};
          },
        ),
      },
      user: {
        update: updateUser,
      },
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(currentUser)
          .mockResolvedValueOnce(targetUser),
      },
      vipOrder: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1n,
          userId: currentUser.id,
          planId: plan.id,
          source: VipOrderSource.IOS,
          bindFromUserId: null,
          amount: plan.price,
          createdAt: new Date('2026-05-18T00:00:00.000Z'),
          plan,
        }),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const sendBindVip = jest.fn();
    const pushService = {
      sendBindVip,
    } as unknown as PushService;
    const service = new VipService(prisma as never, pushService);

    const result = await service.bindVip(currentUser.id, {
      toUserId: targetUser.id.toString(),
    });

    expect(result.vipBindQuotaUsed).toBe(1);
    expect(bindOrderData).toMatchObject({
      userId: targetUser.id,
      source: VipOrderSource.BIND,
      bindFromUserId: currentUser.id,
    });
    expect(sendBindVip).toHaveBeenCalledWith(
      expect.objectContaining({
        pushAlias: 'bob-device',
        fromUserId: currentUser.id,
      }),
    );
  });
});

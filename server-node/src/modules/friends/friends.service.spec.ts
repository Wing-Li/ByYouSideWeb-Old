import {
  FriendBlockState,
  FriendStatus,
  Gender,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { BusinessException } from '../../common/errors/business-exception';
import { PushService } from '../../integrations/push/push.service';
import { FriendsService } from './friends.service';

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

function createRelation(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-17T00:00:00.000Z');
  const requester = createUser({ id: 1n });
  const receiver = createUser({
    id: 2n,
    username: 'bob_01',
    email: 'bob@example.com',
    nickname: '小博',
  });
  return {
    id: 10n,
    requesterId: requester.id,
    receiverId: receiver.id,
    requesterAlias: '',
    receiverAlias: '',
    isBestFriend: false,
    status: FriendStatus.PENDING,
    blockState: FriendBlockState.NORMAL,
    createdAt: now,
    updatedAt: now,
    requester,
    receiver,
    ...overrides,
  };
}

describe('FriendsService', () => {
  it('重复发送好友请求时保留旧业务错误码', async () => {
    const existing = createRelation({ status: FriendStatus.PENDING });
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(existing.requester)
          .mockResolvedValueOnce(existing.receiver),
      },
      friendRelation: {
        findUnique: jest.fn().mockResolvedValue(existing),
      },
    };
    const service = new FriendsService(prisma as never, {} as PushService);

    await expect(
      service.requestFriend(1n, { toUserId: '2' }),
    ).rejects.toMatchObject({
      response: { code: 16005 },
    } as BusinessException);
  });

  it('对方已请求自己时会直接建立双向好友关系并发送同意推送', async () => {
    const alice = createUser({ id: 1n });
    const bob = createUser({
      id: 2n,
      username: 'bob_01',
      email: 'bob@example.com',
      nickname: '小博',
      pushDeviceType: 'ios',
      pushAliasType: 'alias',
      pushAlias: 'bob-device',
    });
    const reverse = createRelation({
      id: 20n,
      requesterId: bob.id,
      receiverId: alice.id,
      requester: bob,
      receiver: alice,
      status: FriendStatus.PENDING,
    });
    const accepted = createRelation({
      id: 21n,
      requesterId: alice.id,
      receiverId: bob.id,
      requester: alice,
      receiver: bob,
      status: FriendStatus.ACCEPTED,
    });
    let upsertCreateData: {
      requesterId: bigint;
      receiverId: bigint;
      status?: FriendStatus;
    } | null = null;
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(alice)
          .mockResolvedValueOnce(bob),
      },
      friendRelation: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(reverse),
        update: jest
          .fn()
          .mockResolvedValue({ ...reverse, status: FriendStatus.ACCEPTED }),
        upsert: jest.fn(
          ({
            create,
          }: {
            create: {
              requesterId: bigint;
              receiverId: bigint;
              status?: FriendStatus;
            };
          }) => {
            upsertCreateData = create;
            return accepted;
          },
        ),
      },
      $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
    };
    const sendAgreeAddFriend = jest.fn();
    const pushService = {
      sendAgreeAddFriend,
    } as unknown as PushService;
    const service = new FriendsService(prisma as never, pushService);

    const result = await service.requestFriend(1n, { toUserId: '2' });

    expect(result.status).toBe(FriendStatus.ACCEPTED);
    expect(result.friend.id).toBe('2');
    expect(upsertCreateData).toMatchObject({
      requesterId: 1n,
      receiverId: 2n,
      status: FriendStatus.ACCEPTED,
    });
    expect(sendAgreeAddFriend).toHaveBeenCalledTimes(1);
  });

  it('普通拒绝后再次申请会复用旧关系记录改回等待状态', async () => {
    const existing = createRelation({ status: FriendStatus.REJECTED });
    const pending = createRelation({ status: FriendStatus.PENDING });
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(existing.requester)
          .mockResolvedValueOnce(existing.receiver),
      },
      friendRelation: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(existing)
          .mockResolvedValueOnce(null),
        update: jest.fn().mockResolvedValue(pending),
        create: jest.fn(),
      },
    };
    const pushService = {
      sendRequestAddFriend: jest.fn(),
    } as unknown as PushService;
    const service = new FriendsService(prisma as never, pushService);

    const result = await service.requestFriend(1n, { toUserId: '2' });

    expect(result.status).toBe(FriendStatus.PENDING);
    expect(prisma.friendRelation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: existing.id },
        data: { status: FriendStatus.PENDING },
      }),
    );
    expect(prisma.friendRelation.create).not.toHaveBeenCalled();
  });
});

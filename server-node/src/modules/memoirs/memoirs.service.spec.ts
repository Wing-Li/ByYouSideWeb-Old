import {
  FriendStatus,
  Gender,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { MemoirsService } from './memoirs.service';

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

function createMemoir(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-18T00:00:00.000Z');
  const author = createUser();
  return {
    id: 1n,
    friendRelationId: 1n,
    authorId: author.id,
    title: '第一次一起看海',
    content: '那天风很大，但我们都笑得很开心。',
    happenedAt: now,
    createdAt: now,
    updatedAt: now,
    author,
    ...overrides,
  };
}

describe('MemoirsService', () => {
  it('创建回忆录时要求当前用户拥有已接受好友关系', async () => {
    const relation = {
      id: 1n,
      requesterId: 1n,
      receiverId: 2n,
      status: FriendStatus.ACCEPTED,
    };
    let createdFriendRelationId: bigint | null = null;
    let createdAuthorId: bigint | null = null;
    const memoir = createMemoir();
    const prisma = {
      friendRelation: {
        findUnique: jest.fn().mockResolvedValue(relation),
      },
      memoir: {
        create: jest.fn(
          (args: { data: { friendRelationId: bigint; authorId: bigint } }) => {
            createdFriendRelationId = args.data.friendRelationId;
            createdAuthorId = args.data.authorId;
            return memoir;
          },
        ),
      },
    };
    const service = new MemoirsService(prisma as never);

    const result = await service.createMemoir(1n, {
      friendRelationId: '1',
      title: '第一次一起看海',
      content: '那天风很大，但我们都笑得很开心。',
      happenedAt: '2026-05-18T00:00:00.000Z',
    });

    expect(result.title).toBe('第一次一起看海');
    expect(createdFriendRelationId).toBe(1n);
    expect(createdAuthorId).toBe(1n);
  });

  it('非作者不能更新回忆录', async () => {
    const prisma = {
      memoir: {
        findUnique: jest.fn().mockResolvedValue(createMemoir({ authorId: 2n })),
      },
    };
    const service = new MemoirsService(prisma as never);

    await expect(
      service.updateMemoir(1n, '1', { title: '新的标题' }),
    ).rejects.toMatchObject({ response: { code: 15002 } });
  });

  it('列表会同时读取双方好友关系下的回忆录', async () => {
    const relation = {
      id: 1n,
      requesterId: 1n,
      receiverId: 2n,
      status: FriendStatus.ACCEPTED,
    };
    const reverse = {
      id: 2n,
      requesterId: 2n,
      receiverId: 1n,
      status: FriendStatus.ACCEPTED,
    };
    const prisma = {
      friendRelation: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(relation)
          .mockResolvedValueOnce(reverse),
      },
      memoir: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([createMemoir()]),
      },
    };
    const service = new MemoirsService(prisma as never);

    const result = await service.listMemoirs(1n, {
      friendRelationId: '1',
      page: 1,
      pageSize: 20,
    });

    expect(result.pagination.total).toBe(1);
    expect(prisma.memoir.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { friendRelationId: { in: [1n, 2n] } },
      }),
    );
  });
});

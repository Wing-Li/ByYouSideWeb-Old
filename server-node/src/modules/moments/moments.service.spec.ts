import {
  FriendStatus,
  Gender,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { MomentsService } from './moments.service';

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

function createMoment(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-18T00:00:00.000Z');
  const author = createUser();
  return {
    id: 1n,
    friendRelationId: 1n,
    authorId: author.id,
    content: '今天的晚霞很好看。',
    happenedAt: now,
    createdAt: now,
    updatedAt: now,
    author,
    ...overrides,
  };
}

describe('MomentsService', () => {
  it('创建瞬间时要求当前用户拥有已接受好友关系', async () => {
    const relation = {
      id: 1n,
      requesterId: 1n,
      receiverId: 2n,
      status: FriendStatus.ACCEPTED,
    };
    let createdFriendRelationId: bigint | null = null;
    let createdAuthorId: bigint | null = null;
    const moment = createMoment();
    const prisma = {
      friendRelation: {
        findUnique: jest.fn().mockResolvedValue(relation),
      },
      moment: {
        create: jest.fn(
          (args: { data: { friendRelationId: bigint; authorId: bigint } }) => {
            createdFriendRelationId = args.data.friendRelationId;
            createdAuthorId = args.data.authorId;
            return moment;
          },
        ),
      },
    };
    const service = new MomentsService(prisma as never);

    const result = await service.createMoment(1n, {
      friendRelationId: '1',
      content: '今天的晚霞很好看。',
      happenedAt: '2026-05-18T00:00:00.000Z',
    });

    expect(result.content).toBe('今天的晚霞很好看。');
    expect(createdFriendRelationId).toBe(1n);
    expect(createdAuthorId).toBe(1n);
  });

  it('非作者不能删除瞬间', async () => {
    const prisma = {
      moment: {
        findUnique: jest.fn().mockResolvedValue(createMoment({ authorId: 2n })),
      },
    };
    const service = new MomentsService(prisma as never);

    await expect(service.deleteMoment(1n, '1')).rejects.toMatchObject({
      response: { code: 16013 },
    });
  });
});

import { UserRole, UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { JwtTokenService } from '../../common/auth/jwt-token.service';
import { MailService } from '../../integrations/mail/mail.service';
import { BusinessException } from '../../common/errors/business-exception';

function createUser(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-17T00:00:00.000Z');
  return {
    id: 1n,
    username: 'alice_01',
    email: 'alice@example.com',
    passwordHash: 'hash',
    nickname: '',
    avatarUrl: '',
    gender: 'UNKNOWN',
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
    lastLocationLongitude: { toString: () => '0' },
    lastLocationLatitude: { toString: () => '0' },
    lastLocationAt: null,
    pushDeviceType: null,
    pushAliasType: null,
    pushAlias: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AuthService', () => {
  it('注册成功时会写入 hash 密码并返回 token', async () => {
    const user = createUser();
    let createdUsername = '';
    let createdEmail = '';
    let createdPasswordHash = '';
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(
          ({
            data,
          }: {
            data: { username: string; email: string; passwordHash: string };
          }) => {
            createdUsername = data.username;
            createdEmail = data.email;
            createdPasswordHash = data.passwordHash;
            return user;
          },
        ),
      },
    };
    const jwtTokenService = {
      sign: jest.fn().mockReturnValue('Bearer token'),
    } as unknown as JwtTokenService;
    const mailService = {} as MailService;
    const service = new AuthService(
      prisma as never,
      jwtTokenService,
      mailService,
    );

    const result = await service.register({
      username: 'alice_01',
      password: 'ChangeMe_123456',
      email: 'ALICE@example.com',
    });

    expect(result.token).toBe('Bearer token');
    expect(result.user.email).toBe('alice@example.com');
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(createdUsername).toBe('alice_01');
    expect(createdEmail).toBe('alice@example.com');
    expect(createdPasswordHash).not.toBe('ChangeMe_123456');
  });

  it('用户名重复时返回旧业务语义错误码', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValueOnce(createUser()),
      },
    };
    const service = new AuthService(
      prisma as never,
      {} as JwtTokenService,
      {} as MailService,
    );

    try {
      await service.register({
        username: 'alice_01',
        password: 'ChangeMe_123456',
        email: 'alice@example.com',
      });
      throw new Error('预期注册失败，但实际成功');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BusinessException);
      expect((error as BusinessException).getResponse()).toMatchObject({
        code: 10004,
      });
    }
  });
});

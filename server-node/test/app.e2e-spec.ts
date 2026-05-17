import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/setup-app';
import { setupSwagger } from './../src/setup-swagger';
import { PrismaService } from './../src/database/prisma.service';
import { Gender, Prisma, UserRole, UserStatus } from '@prisma/client';

type FakeUser = {
  id: bigint;
  username: string;
  email: string;
  passwordHash: string;
  nickname: string;
  avatarUrl: string;
  gender: Gender;
  bio: string;
  birthday: Date | null;
  role: UserRole;
  status: UserStatus;
  disabledDays: number;
  uploadIntervalMinutes: number;
  vipLevel: number;
  vipSource: null;
  vipExpiresAt: Date | null;
  vipBindQuotaTotal: number;
  vipBindQuotaUsed: number;
  destroyRequestedAt: Date | null;
  destroyReason: string | null;
  lastLocationAddress: string;
  lastLocationLongitude: Prisma.Decimal;
  lastLocationLatitude: Prisma.Decimal;
  lastLocationAt: Date | null;
  pushDeviceType: string | null;
  pushAliasType: string | null;
  pushAlias: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class FakePrismaService {
  private nextUserId = 1n;
  readonly users: FakeUser[] = [];

  user = {
    findUnique: jest.fn(
      ({
        where,
      }: {
        where: { id?: bigint; username?: string; email?: string };
      }) =>
        this.users.find(
          (user) =>
            (where.id !== undefined && user.id === where.id) ||
            (where.username !== undefined &&
              user.username === where.username) ||
            (where.email !== undefined && user.email === where.email),
        ) ?? null,
    ),
    findFirst: jest.fn(
      ({
        where,
      }: {
        where: {
          OR?: Array<{ username?: string; email?: string }>;
          NOT?: { id?: bigint };
          email?: string;
        };
      }) => {
        const candidates = where.OR
          ? this.users.filter((user) =>
              where.OR?.some(
                (condition) =>
                  condition.username === user.username ||
                  condition.email === user.email,
              ),
            )
          : this.users.filter((user) => user.email === where.email);
        return (
          candidates.find(
            (user) => where.NOT?.id === undefined || user.id !== where.NOT.id,
          ) ?? null
        );
      },
    ),
    create: jest.fn(({ data }: { data: Partial<FakeUser> }) => {
      const now = new Date('2026-05-17T00:00:00.000Z');
      const user: FakeUser = {
        id: this.nextUserId++,
        username: data.username ?? '',
        email: data.email ?? '',
        passwordHash: data.passwordHash ?? '',
        nickname: data.nickname ?? '',
        avatarUrl: data.avatarUrl ?? '',
        gender: data.gender ?? Gender.UNKNOWN,
        bio: data.bio ?? '',
        birthday: data.birthday ?? null,
        role: data.role ?? UserRole.USER,
        status: data.status ?? UserStatus.ACTIVE,
        disabledDays: data.disabledDays ?? 0,
        uploadIntervalMinutes: data.uploadIntervalMinutes ?? 120,
        vipLevel: data.vipLevel ?? 0,
        vipSource: null,
        vipExpiresAt: null,
        vipBindQuotaTotal: data.vipBindQuotaTotal ?? 0,
        vipBindQuotaUsed: data.vipBindQuotaUsed ?? 0,
        destroyRequestedAt: data.destroyRequestedAt ?? null,
        destroyReason: data.destroyReason ?? null,
        lastLocationAddress: data.lastLocationAddress ?? '',
        lastLocationLongitude: new Prisma.Decimal(0),
        lastLocationLatitude: new Prisma.Decimal(0),
        lastLocationAt: null,
        pushDeviceType: null,
        pushAliasType: null,
        pushAlias: null,
        createdAt: now,
        updatedAt: now,
      };
      this.users.push(user);
      return user;
    }),
    update: jest.fn(
      ({ where, data }: { where: { id: bigint }; data: Partial<FakeUser> }) => {
        const user = this.users.find((item) => item.id === where.id);
        if (!user) {
          throw new Error('user not found');
        }
        Object.assign(user, data, {
          updatedAt: new Date('2026-05-17T00:01:00.000Z'),
        });
        return user;
      },
    ),
  };

  verificationCode = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  $transaction = jest.fn((operations: Array<Promise<unknown>>) =>
    Promise.all(operations),
  );
}

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    setupSwagger(app);
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          code: unknown;
          message: unknown;
          data: {
            status: unknown;
            service: unknown;
            timestamp: unknown;
          };
        };

        expect(body).toMatchObject({
          code: 200,
          message: 'success',
          data: {
            status: 'ok',
            service: 'byyouside-api',
          },
        });
        expect(typeof body.data.timestamp).toBe('string');
      });
  });

  it('/api/docs-json (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          info: { title: unknown; version: unknown };
          paths: Record<string, unknown>;
        };

        expect(body.info.title).toBe('伴你左右 API');
        expect(body.info.version).toBe('1.0.0');
        expect(body.paths).toHaveProperty('/api/v1/health');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

describe('Auth and Users (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: FakePrismaService;

  beforeEach(async () => {
    prisma = new FakePrismaService();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    setupSwagger(app);
    await app.init();
  });

  it('注册、登录、更新资料、注销申请和取消注销可以形成闭环', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username: 'alice_01',
        password: 'ChangeMe_123456',
        email: 'alice@example.com',
      })
      .expect(201);

    const registerBody = registerResponse.body as {
      code: number;
      data: { token: string; user: { id: string; username: string } };
    };
    expect(registerBody.code).toBe(200);
    expect(registerBody.data.user).toMatchObject({
      id: '1',
      username: 'alice_01',
    });
    expect(registerBody.data.token).toMatch(/^Bearer /);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: 'alice@example.com',
        password: 'ChangeMe_123456',
      })
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            user: {
              id: '1',
              username: 'alice_01',
            },
          },
        });
      });

    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', registerBody.data.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            id: '1',
            username: 'alice_01',
            email: 'alice@example.com',
          },
        });
      });

    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', registerBody.data.token)
      .send({
        nickname: '小艾',
        bio: '正在迁移到新后端。',
      })
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            nickname: '小艾',
            bio: '正在迁移到新后端。',
          },
        });
      });

    await request(app.getHttpServer())
      .post('/api/v1/users/me/destroy-request')
      .set('Authorization', registerBody.data.token)
      .send({ destroyReason: '不再使用账号' })
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            status: UserStatus.DESTROY_REQUESTED,
          },
        });
      });

    await request(app.getHttpServer())
      .post('/api/v1/users/me/destroy-request/cancel')
      .set('Authorization', registerBody.data.token)
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            status: UserStatus.ACTIVE,
          },
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

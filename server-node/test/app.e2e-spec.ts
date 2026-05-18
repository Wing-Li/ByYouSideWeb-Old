import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/setup-app';
import { setupSwagger } from './../src/setup-swagger';
import { PrismaService } from './../src/database/prisma.service';
import {
  FriendBlockState,
  FriendStatus,
  Gender,
  Prisma,
  UserRole,
  UserStatus,
  VipOrderSource,
  VipPlanStatus,
} from '@prisma/client';

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
  vipSource: VipOrderSource | null;
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

type FakeFriendRelation = {
  id: bigint;
  requesterId: bigint;
  receiverId: bigint;
  requesterAlias: string;
  receiverAlias: string;
  isBestFriend: boolean;
  status: FriendStatus;
  blockState: FriendBlockState;
  createdAt: Date;
  updatedAt: Date;
  requester: FakeUser;
  receiver: FakeUser;
};

type FakeDeviceSnapshot = {
  id: bigint;
  userId: bigint;
  deviceName: string;
  screenStatus: string;
  screenLevel: string;
  batteryStatus: string;
  batteryLevel: string;
  volumeLevel: string;
  bluetoothStatus: string;
  bluetoothName: string;
  wifiStatus: string;
  wifiName: string;
  gpsStatus: string;
  locationSource: string;
  locationAddress: string;
  locationLongitude: Prisma.Decimal;
  locationLatitude: Prisma.Decimal;
  createdAt: Date;
};

type FakeMemoir = {
  id: bigint;
  friendRelationId: bigint;
  authorId: bigint;
  title: string;
  content: string;
  happenedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  author: FakeUser;
};

type FakeMoment = {
  id: bigint;
  friendRelationId: bigint;
  authorId: bigint;
  content: string;
  happenedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  author: FakeUser;
};

type FakeVipPlan = {
  id: bigint;
  name: string;
  description: string;
  level: number;
  durationMonths: number;
  price: Prisma.Decimal;
  productCode: string;
  status: VipPlanStatus;
  createdAt: Date;
  updatedAt: Date;
};

type FakeVipOrder = {
  id: bigint;
  userId: bigint;
  planId: bigint;
  source: VipOrderSource;
  bindFromUserId: bigint | null;
  amount: Prisma.Decimal;
  createdAt: Date;
  plan: FakeVipPlan;
};

class FakePrismaService {
  private nextUserId = 1n;
  private nextFriendRelationId = 1n;
  private nextDeviceSnapshotId = 1n;
  private nextMemoirId = 1n;
  private nextMomentId = 1n;
  private nextVipPlanId = 1n;
  private nextVipOrderId = 1n;
  readonly users: FakeUser[] = [];
  readonly friendRelations: FakeFriendRelation[] = [];
  readonly deviceSnapshots: FakeDeviceSnapshot[] = [];
  readonly memoirs: FakeMemoir[] = [];
  readonly moments: FakeMoment[] = [];
  readonly vipPlans: FakeVipPlan[] = [];
  readonly vipOrders: FakeVipOrder[] = [];

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
        vipSource: data.vipSource ?? null,
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

  friendRelation = {
    findUnique: jest.fn(
      ({
        where,
      }: {
        where: {
          id?: bigint;
          requesterId_receiverId?: {
            requesterId: bigint;
            receiverId: bigint;
          };
        };
      }) => this.findFriendRelation(where) ?? null,
    ),
    create: jest.fn(
      ({
        data,
      }: {
        data: {
          requesterId: bigint;
          receiverId: bigint;
          status?: FriendStatus;
        };
      }) => this.createFriendRelation(data),
    ),
    update: jest.fn(
      ({
        where,
        data,
      }: {
        where: { id: bigint };
        data: Partial<FakeFriendRelation>;
      }) => this.updateFriendRelation(where.id, data),
    ),
    upsert: jest.fn(
      ({
        where,
        create,
        update,
      }: {
        where: {
          requesterId_receiverId: {
            requesterId: bigint;
            receiverId: bigint;
          };
        };
        create: {
          requesterId: bigint;
          receiverId: bigint;
          status?: FriendStatus;
        };
        update: Partial<FakeFriendRelation>;
      }) => {
        const existing = this.findFriendRelation(where);
        if (existing) {
          return this.updateFriendRelation(existing.id, update);
        }
        return this.createFriendRelation(create);
      },
    ),
    deleteMany: jest.fn(({ where }: { where: { id: { in: bigint[] } } }) => {
      const before = this.friendRelations.length;
      for (const id of where.id.in) {
        const index = this.friendRelations.findIndex((item) => item.id === id);
        if (index >= 0) {
          this.friendRelations.splice(index, 1);
        }
      }
      return { count: before - this.friendRelations.length };
    }),
    updateMany: jest.fn(
      ({
        where,
        data,
      }: {
        where: {
          requesterId: bigint;
          status: FriendStatus;
          isBestFriend: boolean;
          NOT?: { id: bigint };
        };
        data: Partial<FakeFriendRelation>;
      }) => {
        let count = 0;
        for (const relation of this.friendRelations) {
          if (
            relation.requesterId === where.requesterId &&
            relation.status === where.status &&
            relation.isBestFriend === where.isBestFriend &&
            relation.id !== where.NOT?.id
          ) {
            Object.assign(relation, data);
            count += 1;
          }
        }
        return { count };
      },
    ),
    count: jest.fn(
      ({ where }: { where: FriendWhere }) =>
        this.filterFriendRelations(where).length,
    ),
    findMany: jest.fn(
      ({
        where,
        skip,
        take,
      }: {
        where: FriendWhere;
        skip: number;
        take: number;
      }) => this.filterFriendRelations(where).slice(skip, skip + take),
    ),
  };

  deviceSnapshot = {
    create: jest.fn(
      ({ data }: { data: Partial<FakeDeviceSnapshot> & { userId: bigint } }) =>
        this.createDeviceSnapshot(data),
    ),
    count: jest.fn(
      ({ where }: { where: { userId: bigint } }) =>
        this.deviceSnapshots.filter((item) => item.userId === where.userId)
          .length,
    ),
    findMany: jest.fn(
      ({
        where,
        skip,
        take,
      }: {
        where: { userId: bigint };
        skip: number;
        take: number;
      }) =>
        this.deviceSnapshots
          .filter((item) => item.userId === where.userId)
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .slice(skip, skip + take),
    ),
    findFirst: jest.fn(
      ({ where }: { where: { userId: bigint } }) =>
        this.deviceSnapshots
          .filter((item) => item.userId === where.userId)
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .at(0) ?? null,
    ),
  };

  memoir = {
    create: jest.fn(
      ({
        data,
      }: {
        data: {
          friendRelationId: bigint;
          authorId: bigint;
          title: string;
          content: string;
          happenedAt: Date;
        };
      }) => this.createMemoir(data),
    ),
    findUnique: jest.fn(
      ({ where }: { where: { id: bigint } }) =>
        this.memoirs.find((item) => item.id === where.id) ?? null,
    ),
    update: jest.fn(
      ({
        where,
        data,
      }: {
        where: { id: bigint };
        data: Partial<Pick<FakeMemoir, 'title' | 'content' | 'happenedAt'>>;
      }) => this.updateMemoir(where.id, data),
    ),
    delete: jest.fn(({ where }: { where: { id: bigint } }) => {
      const index = this.memoirs.findIndex((item) => item.id === where.id);
      if (index >= 0) {
        this.memoirs.splice(index, 1);
      }
      return {};
    }),
    count: jest.fn(
      ({ where }: { where: { friendRelationId: { in: bigint[] } } }) =>
        this.memoirs.filter((item) =>
          where.friendRelationId.in.includes(item.friendRelationId),
        ).length,
    ),
    findMany: jest.fn(
      ({
        where,
        skip,
        take,
      }: {
        where: { friendRelationId: { in: bigint[] } };
        skip: number;
        take: number;
      }) =>
        this.memoirs
          .filter((item) =>
            where.friendRelationId.in.includes(item.friendRelationId),
          )
          .sort(
            (left, right) =>
              right.happenedAt.getTime() - left.happenedAt.getTime() ||
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .slice(skip, skip + take),
    ),
    deleteMany: jest.fn(
      ({ where }: { where: { friendRelationId: { in: bigint[] } } }) => {
        const before = this.memoirs.length;
        for (let index = this.memoirs.length - 1; index >= 0; index -= 1) {
          if (
            where.friendRelationId.in.includes(
              this.memoirs[index].friendRelationId,
            )
          ) {
            this.memoirs.splice(index, 1);
          }
        }
        return { count: before - this.memoirs.length };
      },
    ),
  };

  moment = {
    create: jest.fn(
      ({
        data,
      }: {
        data: {
          friendRelationId: bigint;
          authorId: bigint;
          content: string;
          happenedAt: Date;
        };
      }) => this.createMoment(data),
    ),
    findUnique: jest.fn(
      ({ where }: { where: { id: bigint } }) =>
        this.moments.find((item) => item.id === where.id) ?? null,
    ),
    update: jest.fn(
      ({
        where,
        data,
      }: {
        where: { id: bigint };
        data: Partial<Pick<FakeMoment, 'content' | 'happenedAt'>>;
      }) => this.updateMoment(where.id, data),
    ),
    delete: jest.fn(({ where }: { where: { id: bigint } }) => {
      const index = this.moments.findIndex((item) => item.id === where.id);
      if (index >= 0) {
        this.moments.splice(index, 1);
      }
      return {};
    }),
    count: jest.fn(
      ({ where }: { where: { friendRelationId: { in: bigint[] } } }) =>
        this.moments.filter((item) =>
          where.friendRelationId.in.includes(item.friendRelationId),
        ).length,
    ),
    findMany: jest.fn(
      ({
        where,
        skip,
        take,
      }: {
        where: { friendRelationId: { in: bigint[] } };
        skip: number;
        take: number;
      }) =>
        this.moments
          .filter((item) =>
            where.friendRelationId.in.includes(item.friendRelationId),
          )
          .sort(
            (left, right) =>
              right.happenedAt.getTime() - left.happenedAt.getTime() ||
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .slice(skip, skip + take),
    ),
    deleteMany: jest.fn(
      ({ where }: { where: { friendRelationId: { in: bigint[] } } }) => {
        const before = this.moments.length;
        for (let index = this.moments.length - 1; index >= 0; index -= 1) {
          if (
            where.friendRelationId.in.includes(
              this.moments[index].friendRelationId,
            )
          ) {
            this.moments.splice(index, 1);
          }
        }
        return { count: before - this.moments.length };
      },
    ),
  };

  vipPlan = {
    findMany: jest.fn(() =>
      [...this.vipPlans].sort((left, right) =>
        left.durationMonths === right.durationMonths
          ? Number(left.id - right.id)
          : left.durationMonths - right.durationMonths,
      ),
    ),
    findUnique: jest.fn(
      ({ where }: { where: { id?: bigint; productCode?: string } }) =>
        this.vipPlans.find(
          (plan) =>
            (where.id !== undefined && plan.id === where.id) ||
            (where.productCode !== undefined &&
              plan.productCode === where.productCode),
        ) ?? null,
    ),
    create: jest.fn(({ data }: { data: Partial<FakeVipPlan> }) =>
      this.createVipPlan(data),
    ),
    update: jest.fn(
      ({
        where,
        data,
      }: {
        where: { id: bigint };
        data: Partial<FakeVipPlan>;
      }) => this.updateVipPlan(where.id, data),
    ),
  };

  vipOrder = {
    create: jest.fn(
      ({
        data,
      }: {
        data: {
          userId: bigint;
          planId: bigint;
          source: VipOrderSource;
          bindFromUserId?: bigint | null;
          amount: Prisma.Decimal;
        };
      }) => this.createVipOrder(data),
    ),
    findFirst: jest.fn(
      ({ where }: { where: { userId: bigint } }) =>
        this.vipOrders
          .filter((order) => order.userId === where.userId)
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .at(0) ?? null,
    ),
    count: jest.fn(
      ({ where }: { where: { userId?: bigint } }) =>
        this.filterVipOrders(where).length,
    ),
    findMany: jest.fn(
      ({
        where,
        skip,
        take,
      }: {
        where: { userId?: bigint };
        skip: number;
        take: number;
      }) => this.filterVipOrders(where).slice(skip, skip + take),
    ),
  };

  $transaction = jest.fn(
    (
      operationsOrCallback:
        | Array<Promise<unknown>>
        | ((tx: FakePrismaService) => Promise<unknown>),
    ) => {
      if (typeof operationsOrCallback === 'function') {
        return operationsOrCallback(this);
      }
      return Promise.all(operationsOrCallback);
    },
  );

  private createFriendRelation(data: {
    requesterId: bigint;
    receiverId: bigint;
    status?: FriendStatus;
  }): FakeFriendRelation {
    const now = new Date('2026-05-17T00:00:00.000Z');
    const requester = this.users.find((user) => user.id === data.requesterId);
    const receiver = this.users.find((user) => user.id === data.receiverId);
    if (!requester || !receiver) {
      throw new Error('user not found');
    }
    const relation: FakeFriendRelation = {
      id: this.nextFriendRelationId++,
      requesterId: data.requesterId,
      receiverId: data.receiverId,
      requesterAlias: '',
      receiverAlias: '',
      isBestFriend: false,
      status: data.status ?? FriendStatus.PENDING,
      blockState: FriendBlockState.NORMAL,
      createdAt: now,
      updatedAt: now,
      requester,
      receiver,
    };
    this.friendRelations.push(relation);
    return relation;
  }

  private createDeviceSnapshot(
    data: Partial<FakeDeviceSnapshot> & { userId: bigint },
  ): FakeDeviceSnapshot {
    const snapshot: FakeDeviceSnapshot = {
      id: this.nextDeviceSnapshotId++,
      userId: data.userId,
      deviceName: data.deviceName ?? '',
      screenStatus: data.screenStatus ?? '',
      screenLevel: data.screenLevel ?? '',
      batteryStatus: data.batteryStatus ?? '',
      batteryLevel: data.batteryLevel ?? '',
      volumeLevel: data.volumeLevel ?? '',
      bluetoothStatus: data.bluetoothStatus ?? '',
      bluetoothName: data.bluetoothName ?? '',
      wifiStatus: data.wifiStatus ?? '',
      wifiName: data.wifiName ?? '',
      gpsStatus: data.gpsStatus ?? '',
      locationSource: data.locationSource ?? '',
      locationAddress: data.locationAddress ?? '',
      locationLongitude: data.locationLongitude ?? new Prisma.Decimal(0),
      locationLatitude: data.locationLatitude ?? new Prisma.Decimal(0),
      createdAt: new Date('2026-05-17T00:00:00.000Z'),
    };
    this.deviceSnapshots.push(snapshot);
    return snapshot;
  }

  private createMemoir(data: {
    friendRelationId: bigint;
    authorId: bigint;
    title: string;
    content: string;
    happenedAt: Date;
  }): FakeMemoir {
    const author = this.users.find((user) => user.id === data.authorId);
    if (!author) {
      throw new Error('user not found');
    }
    const now = new Date('2026-05-17T00:00:00.000Z');
    const memoir: FakeMemoir = {
      id: this.nextMemoirId++,
      friendRelationId: data.friendRelationId,
      authorId: data.authorId,
      title: data.title,
      content: data.content,
      happenedAt: data.happenedAt,
      createdAt: now,
      updatedAt: now,
      author,
    };
    this.memoirs.push(memoir);
    return memoir;
  }

  private updateMemoir(
    id: bigint,
    data: Partial<Pick<FakeMemoir, 'title' | 'content' | 'happenedAt'>>,
  ): FakeMemoir {
    const memoir = this.memoirs.find((item) => item.id === id);
    if (!memoir) {
      throw new Error('memoir not found');
    }
    Object.assign(memoir, data, {
      updatedAt: new Date('2026-05-17T00:01:00.000Z'),
    });
    return memoir;
  }

  private createMoment(data: {
    friendRelationId: bigint;
    authorId: bigint;
    content: string;
    happenedAt: Date;
  }): FakeMoment {
    const author = this.users.find((user) => user.id === data.authorId);
    if (!author) {
      throw new Error('user not found');
    }
    const now = new Date('2026-05-17T00:00:00.000Z');
    const moment: FakeMoment = {
      id: this.nextMomentId++,
      friendRelationId: data.friendRelationId,
      authorId: data.authorId,
      content: data.content,
      happenedAt: data.happenedAt,
      createdAt: now,
      updatedAt: now,
      author,
    };
    this.moments.push(moment);
    return moment;
  }

  private updateMoment(
    id: bigint,
    data: Partial<Pick<FakeMoment, 'content' | 'happenedAt'>>,
  ): FakeMoment {
    const moment = this.moments.find((item) => item.id === id);
    if (!moment) {
      throw new Error('moment not found');
    }
    Object.assign(moment, data, {
      updatedAt: new Date('2026-05-17T00:01:00.000Z'),
    });
    return moment;
  }

  private createVipPlan(data: Partial<FakeVipPlan>): FakeVipPlan {
    const now = new Date('2026-05-17T00:00:00.000Z');
    const plan: FakeVipPlan = {
      id: this.nextVipPlanId++,
      name: data.name ?? '双人包月',
      description: data.description ?? '',
      level: data.level ?? 1,
      durationMonths: data.durationMonths ?? 1,
      price: data.price ?? new Prisma.Decimal('28.80'),
      productCode:
        data.productCode ??
        `com.lyl.byyourside.vip.month.duet.${this.nextVipPlanId.toString()}`,
      status: data.status ?? VipPlanStatus.DUET,
      createdAt: now,
      updatedAt: now,
    };
    this.vipPlans.push(plan);
    return plan;
  }

  private updateVipPlan(id: bigint, data: Partial<FakeVipPlan>): FakeVipPlan {
    const plan = this.vipPlans.find((item) => item.id === id);
    if (!plan) {
      throw new Error('vip plan not found');
    }
    Object.assign(plan, data, {
      updatedAt: new Date('2026-05-17T00:01:00.000Z'),
    });
    return plan;
  }

  private createVipOrder(data: {
    userId: bigint;
    planId: bigint;
    source: VipOrderSource;
    bindFromUserId?: bigint | null;
    amount: Prisma.Decimal;
  }): FakeVipOrder {
    const plan = this.vipPlans.find((item) => item.id === data.planId);
    if (!plan) {
      throw new Error('vip plan not found');
    }
    const order: FakeVipOrder = {
      id: this.nextVipOrderId++,
      userId: data.userId,
      planId: data.planId,
      source: data.source,
      bindFromUserId: data.bindFromUserId ?? null,
      amount: data.amount,
      createdAt: new Date('2026-05-17T00:00:00.000Z'),
      plan,
    };
    this.vipOrders.push(order);
    return order;
  }

  private filterVipOrders(where: { userId?: bigint }): FakeVipOrder[] {
    return this.vipOrders
      .filter(
        (order) => where.userId === undefined || order.userId === where.userId,
      )
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
  }

  private updateFriendRelation(
    id: bigint,
    data: Partial<FakeFriendRelation>,
  ): FakeFriendRelation {
    const relation = this.friendRelations.find((item) => item.id === id);
    if (!relation) {
      throw new Error('friend relation not found');
    }
    Object.assign(relation, data, {
      updatedAt: new Date('2026-05-17T00:01:00.000Z'),
    });
    return relation;
  }

  private findFriendRelation(where: {
    id?: bigint;
    requesterId_receiverId?: { requesterId: bigint; receiverId: bigint };
  }): FakeFriendRelation | undefined {
    return this.friendRelations.find(
      (relation) =>
        relation.id === where.id ||
        (where.requesterId_receiverId !== undefined &&
          relation.requesterId === where.requesterId_receiverId.requesterId &&
          relation.receiverId === where.requesterId_receiverId.receiverId),
    );
  }

  private filterFriendRelations(where: FriendWhere): FakeFriendRelation[] {
    return this.friendRelations
      .filter(
        (relation) =>
          (where.requesterId === undefined ||
            relation.requesterId === where.requesterId) &&
          (where.receiverId === undefined ||
            relation.receiverId === where.receiverId) &&
          where.status.in.includes(relation.status),
      )
      .sort(
        (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
      );
  }
}

type FriendWhere = {
  requesterId?: bigint;
  receiverId?: bigint;
  status: { in: FriendStatus[] };
};

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

describe('Friends (e2e)', () => {
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

  it('好友请求、同意、列表、备注、拉黑、绑定亲密好友和删除可以形成闭环', async () => {
    const alice = await registerUser('alice_01', 'alice@example.com');
    const bob = await registerUser('bob_01', 'bob@example.com');

    const requestResponse = await request(app.getHttpServer())
      .post('/api/v1/friends/requests')
      .set('Authorization', alice.token)
      .send({ toUserId: bob.id })
      .expect(201);
    const requestId = (requestResponse.body as { data: { id: string } }).data
      .id;

    await request(app.getHttpServer())
      .get('/api/v1/friends/requests/incoming')
      .set('Authorization', bob.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: [
            {
              id: requestId,
              status: FriendStatus.PENDING,
              friend: { username: 'alice_01' },
            },
          ],
          pagination: { total: 1 },
        });
      });

    const acceptResponse = await request(app.getHttpServer())
      .post(`/api/v1/friends/requests/${requestId}/accept`)
      .set('Authorization', bob.token)
      .expect(201);
    const bobRelationId = (acceptResponse.body as { data: { id: string } }).data
      .id;

    await request(app.getHttpServer())
      .get('/api/v1/friends')
      .set('Authorization', alice.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          data: [
            {
              status: FriendStatus.ACCEPTED,
              friend: { username: 'bob_01' },
            },
          ],
        });
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/friends/${bobRelationId}/alias`)
      .set('Authorization', bob.token)
      .send({ friendAlias: '小艾' })
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({ code: 200, data: '修改成功' });
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/friends/${bobRelationId}/block`)
      .set('Authorization', bob.token)
      .send({ isBlock: true })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/friends/${bobRelationId}/best`)
      .set('Authorization', bob.token)
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          data: { isBestFriend: true },
        });
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/friends/${bobRelationId}`)
      .set('Authorization', bob.token)
      .expect(200);
    expect(prisma.friendRelations).toHaveLength(0);
  });

  async function registerUser(
    username: string,
    email: string,
  ): Promise<{ id: string; token: string }> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username,
        password: 'ChangeMe_123456',
        email,
      })
      .expect(201);
    const body = response.body as {
      data: { token: string; user: { id: string } };
    };
    return {
      id: body.data.user.id,
      token: body.data.token,
    };
  }

  afterEach(async () => {
    await app.close();
  });
});

describe('Devices (e2e)', () => {
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

  it('设备上报、最新状态、好友查询和请求位置可以形成主链路', async () => {
    const alice = await registerUser('alice_01', 'alice.devices@example.com');
    const bob = await registerUser('bob_01', 'bob.devices@example.com');

    const requestResponse = await request(app.getHttpServer())
      .post('/api/v1/friends/requests')
      .set('Authorization', alice.token)
      .send({ toUserId: bob.id })
      .expect(201);
    const requestId = (requestResponse.body as { data: { id: string } }).data
      .id;

    await request(app.getHttpServer())
      .post(`/api/v1/friends/requests/${requestId}/accept`)
      .set('Authorization', bob.token)
      .expect(201);

    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', bob.token)
      .send({
        pushDeviceType: 'ios',
        pushAliasType: 'push_normal',
        pushAlias: 'bob-device',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/devices/snapshots')
      .set('Authorization', bob.token)
      .send({
        deviceName: 'iPhone',
        batteryLevel: '76',
        locationSource: 'gps',
        locationAddress: '北京市朝阳区',
        locationLongitude: 116.4074,
        locationLatitude: 39.9042,
      })
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            userId: bob.id,
            deviceName: 'iPhone',
            locationAddress: '北京市朝阳区',
          },
        });
      });

    await request(app.getHttpServer())
      .get('/api/v1/devices/me/snapshots/latest')
      .set('Authorization', bob.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          data: {
            userId: bob.id,
            batteryLevel: '76',
          },
        });
      });

    await request(app.getHttpServer())
      .get(`/api/v1/devices/users/${bob.id}/snapshots`)
      .set('Authorization', alice.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: [
            {
              userId: bob.id,
              locationAddress: '北京市朝阳区',
            },
          ],
          pagination: { total: 1 },
        });
      });

    await request(app.getHttpServer())
      .post(`/api/v1/devices/users/${bob.id}/location-request`)
      .set('Authorization', alice.token)
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: '通知发送成功',
        });
      });
  });

  async function registerUser(
    username: string,
    email: string,
  ): Promise<{ id: string; token: string }> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username,
        password: 'ChangeMe_123456',
        email,
      })
      .expect(201);
    const body = response.body as {
      data: { token: string; user: { id: string } };
    };
    return {
      id: body.data.user.id,
      token: body.data.token,
    };
  }

  afterEach(async () => {
    await app.close();
  });
});

describe('Memoirs and Moments (e2e)', () => {
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

  it('回忆录和瞬间可以创建、查询、更新和删除，并限制非作者写操作', async () => {
    const alice = await registerUser('alice_01', 'alice.content@example.com');
    const bob = await registerUser('bob_01', 'bob.content@example.com');

    const requestResponse = await request(app.getHttpServer())
      .post('/api/v1/friends/requests')
      .set('Authorization', alice.token)
      .send({ toUserId: bob.id })
      .expect(201);
    const requestId = (requestResponse.body as { data: { id: string } }).data
      .id;

    const acceptResponse = await request(app.getHttpServer())
      .post(`/api/v1/friends/requests/${requestId}/accept`)
      .set('Authorization', bob.token)
      .expect(201);
    const bobRelationId = (acceptResponse.body as { data: { id: string } }).data
      .id;

    const memoirResponse = await request(app.getHttpServer())
      .post('/api/v1/memoirs')
      .set('Authorization', bob.token)
      .send({
        friendRelationId: bobRelationId,
        title: '第一次一起看海',
        content: '那天风很大，但我们都笑得很开心。',
        happenedAt: '2026-05-18T12:00:00.000Z',
      })
      .expect(201);
    const memoirId = (memoirResponse.body as { data: { id: string } }).data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/memoirs/${memoirId}`)
      .set('Authorization', alice.token)
      .send({ title: '不应该成功' })
      .expect(403)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 15002,
          message: '此回忆不是您写的，无法修改',
        });
      });

    await request(app.getHttpServer())
      .get(`/api/v1/memoirs/${memoirId}`)
      .set('Authorization', alice.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            id: memoirId,
            title: '第一次一起看海',
            author: { username: 'bob_01' },
          },
        });
      });

    await request(app.getHttpServer())
      .get('/api/v1/memoirs')
      .query({ friendRelationId: bobRelationId })
      .set('Authorization', bob.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: [{ id: memoirId }],
          pagination: { total: 1 },
        });
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/memoirs/${memoirId}`)
      .set('Authorization', bob.token)
      .send({ title: '一起看海的那天' })
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          data: { title: '一起看海的那天' },
        });
      });

    const momentResponse = await request(app.getHttpServer())
      .post('/api/v1/moments')
      .set('Authorization', bob.token)
      .send({
        friendRelationId: bobRelationId,
        content: '今天的晚霞很好看。',
        happenedAt: '2026-05-18T13:00:00.000Z',
      })
      .expect(201);
    const momentId = (momentResponse.body as { data: { id: string } }).data.id;

    await request(app.getHttpServer())
      .get('/api/v1/moments')
      .query({ friendRelationId: bobRelationId })
      .set('Authorization', bob.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          data: [{ id: momentId, content: '今天的晚霞很好看。' }],
          pagination: { total: 1 },
        });
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/moments/${momentId}`)
      .set('Authorization', alice.token)
      .expect(403)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 16013,
          message: '此瞬间不是您写的，无法删除',
        });
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/moments/${momentId}`)
      .set('Authorization', bob.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({ code: 200, data: '删除成功' });
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/memoirs/${memoirId}`)
      .set('Authorization', bob.token)
      .expect(200);
  });

  async function registerUser(
    username: string,
    email: string,
  ): Promise<{ id: string; token: string }> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username,
        password: 'ChangeMe_123456',
        email,
      })
      .expect(201);
    const body = response.body as {
      data: { token: string; user: { id: string } };
    };
    return {
      id: body.data.user.id,
      token: body.data.token,
    };
  }

  afterEach(async () => {
    await app.close();
  });
});

describe('VIP (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: FakePrismaService;

  beforeEach(async () => {
    prisma = new FakePrismaService();
    prisma.vipPlan.create({
      data: {
        name: '双人包月',
        description: '',
        level: 1,
        durationMonths: 1,
        price: new Prisma.Decimal('28.80'),
        productCode: 'com.lyl.byyourside.vip.month.duet.1',
        status: VipPlanStatus.DUET,
      },
    });
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

  it('套餐、开通、订单、绑定和管理员维护可以形成主链路', async () => {
    const alice = await registerUser('alice_vip', 'alice.vip@example.com');
    const bob = await registerUser('bob_vip', 'bob.vip@example.com');
    const admin = await registerUser('admin_vip', 'admin.vip@example.com');
    const adminUser = prisma.users.find(
      (user) => user.id.toString() === admin.id,
    );
    expect(adminUser).toBeDefined();
    adminUser!.role = UserRole.ADMIN;

    const plansResponse = await request(app.getHttpServer())
      .get('/api/v1/vip/plans')
      .set('Authorization', alice.token)
      .expect(200);
    const planId = (plansResponse.body as { data: Array<{ id: string }> })
      .data[0].id;

    await request(app.getHttpServer())
      .post('/api/v1/vip/orders')
      .set('Authorization', alice.token)
      .send({
        planId,
        amount: 28.8,
        source: VipOrderSource.IOS,
      })
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            id: alice.id,
            vipLevel: 1,
            vipSource: VipOrderSource.IOS,
            vipBindQuotaTotal: 1,
            vipBindQuotaUsed: 0,
          },
        });
      });

    await request(app.getHttpServer())
      .get('/api/v1/vip/orders/me')
      .set('Authorization', alice.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: [
            {
              userId: alice.id,
              source: VipOrderSource.IOS,
              plan: { id: planId },
            },
          ],
          pagination: { total: 1 },
        });
      });

    await request(app.getHttpServer())
      .post('/api/v1/vip/bindings')
      .set('Authorization', alice.token)
      .send({ toUserId: bob.id })
      .expect(201)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          data: {
            id: alice.id,
            vipBindQuotaTotal: 1,
            vipBindQuotaUsed: 1,
          },
        });
      });

    await request(app.getHttpServer())
      .post('/api/v1/vip/orders')
      .set('Authorization', bob.token)
      .send({
        planId,
        amount: 28.8,
        source: VipOrderSource.IOS,
        toUserId: alice.id,
      })
      .expect(403)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 17009,
          message: '普通用户不能给他人开通 VIP',
        });
      });

    const createPlanResponse = await request(app.getHttpServer())
      .post('/api/v1/vip/plans')
      .set('Authorization', admin.token)
      .send({
        name: '管理员赠送月卡',
        description: '测试用',
        level: 1,
        durationMonths: 1,
        price: 0,
        productCode: 'admin.gift.month.1',
        status: VipPlanStatus.ACTIVE,
      })
      .expect(201);
    const adminPlanId = (createPlanResponse.body as { data: { id: string } })
      .data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/vip/plans/${adminPlanId}`)
      .set('Authorization', admin.token)
      .send({ description: '管理员测试赠送' })
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          data: { description: '管理员测试赠送' },
        });
      });

    await request(app.getHttpServer())
      .get('/api/v1/vip/orders')
      .set('Authorization', admin.token)
      .expect(200)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          code: 200,
          pagination: { total: 2 },
        });
      });
  });

  async function registerUser(
    username: string,
    email: string,
  ): Promise<{ id: string; token: string }> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username,
        password: 'ChangeMe_123456',
        email,
      })
      .expect(201);
    const body = response.body as {
      data: { token: string; user: { id: string } };
    };
    return {
      id: body.data.user.id,
      token: body.data.token,
    };
  }

  afterEach(async () => {
    await app.close();
  });
});

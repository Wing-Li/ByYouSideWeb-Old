import { HttpStatus, Injectable } from '@nestjs/common';
import {
  FriendBlockState,
  FriendStatus,
  Prisma,
  User,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PushService } from '../../integrations/push/push.service';
import { BusinessException } from '../../common/errors/business-exception';
import { FRIEND_ERROR_CODES } from '../../common/errors/error-codes';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { FriendRelationDto } from './dto/friend-relation.dto';
import { FriendStatusQueryDto } from './dto/friend-status-query.dto';
import { RejectFriendRequestDto } from './dto/reject-friend-request.dto';
import { RequestFriendDto } from './dto/request-friend.dto';
import { UpdateFriendAliasDto } from './dto/update-friend-alias.dto';
import { UpdateFriendBlockDto } from './dto/update-friend-block.dto';
import { FriendRelationWithUsers, toFriendRelationDto } from './friends.mapper';

const FRIEND_INCLUDE = {
  requester: true,
  receiver: true,
} satisfies Prisma.FriendRelationInclude;

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async requestFriend(
    currentUserId: bigint,
    dto: RequestFriendDto,
  ): Promise<FriendRelationDto> {
    const toUserId = this.parseId(dto.toUserId);
    const [currentUser, toUser] = await Promise.all([
      this.findActiveUser(currentUserId),
      this.findActiveUser(toUserId),
    ]);

    const existing = await this.prisma.friendRelation.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: currentUserId,
          receiverId: toUserId,
        },
      },
      include: FRIEND_INCLUDE,
    });
    if (existing) {
      this.assertCanCreateRequestFromExisting(existing.status);
    }

    const reverse = await this.prisma.friendRelation.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: toUserId,
          receiverId: currentUserId,
        },
      },
      include: FRIEND_INCLUDE,
    });

    if (reverse) {
      const accepted = await this.acceptReverseRequest(
        reverse.id,
        currentUser,
        toUser,
      );
      return toFriendRelationDto(accepted, currentUserId);
    }

    const relation =
      existing?.status === FriendStatus.REJECTED
        ? await this.prisma.friendRelation.update({
            where: { id: existing.id },
            data: { status: FriendStatus.PENDING },
            include: FRIEND_INCLUDE,
          })
        : await this.prisma.friendRelation.create({
            data: {
              requesterId: currentUserId,
              receiverId: toUserId,
              status: FriendStatus.PENDING,
            },
            include: FRIEND_INCLUDE,
          });

    this.pushService.sendRequestAddFriend({
      deviceType: toUser.pushDeviceType,
      pushAlias: toUser.pushAlias,
      pushAliasType: toUser.pushAliasType,
      fromUserId: currentUser.id,
      fromUserNickname: currentUser.nickname,
      fromUserAvatarUrl: currentUser.avatarUrl,
    });

    return toFriendRelationDto(relation, currentUserId);
  }

  async acceptFriendRequest(
    currentUserId: bigint,
    relationId: string,
  ): Promise<FriendRelationDto> {
    const relation = await this.findRelationOrThrow(this.parseId(relationId));
    if (relation.receiverId !== currentUserId) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_PERMISSION_DENIED,
        '账户信息出错，请重新登录账号',
        HttpStatus.FORBIDDEN,
      );
    }
    if (relation.status === FriendStatus.ACCEPTED) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.ALREADY_FRIENDS,
        '你们已经是密友关系，无法重复操作',
      );
    }

    const accepted = await this.acceptReverseRequest(
      relation.id,
      relation.receiver,
      relation.requester,
    );
    return toFriendRelationDto(accepted, currentUserId);
  }

  async rejectFriendRequest(
    currentUserId: bigint,
    relationId: string,
    dto: RejectFriendRequestDto,
  ): Promise<FriendRelationDto> {
    const relation = await this.findRelationOrThrow(this.parseId(relationId));
    if (relation.receiverId !== currentUserId) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_PERMISSION_DENIED,
        '账户信息出错，请重新登录账号',
        HttpStatus.FORBIDDEN,
      );
    }
    if (relation.status === FriendStatus.ACCEPTED) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.ALREADY_ACCEPTED,
        '你们已经是好友，无法重复操作',
      );
    }

    const updated = await this.prisma.friendRelation.update({
      where: { id: relation.id },
      data: {
        status: dto.isPermanentRefusal
          ? FriendStatus.REJECTED_BLOCKED
          : FriendStatus.REJECTED,
      },
      include: FRIEND_INCLUDE,
    });
    return toFriendRelationDto(updated, currentUserId);
  }

  async deleteFriend(
    currentUserId: bigint,
    relationId: string,
  ): Promise<string> {
    const relation = await this.findRelationOrThrow(this.parseId(relationId));
    if (relation.requesterId !== currentUserId) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_PERMISSION_DENIED,
        '账户信息出错，请重新登录账号',
        HttpStatus.FORBIDDEN,
      );
    }

    const reverse = await this.prisma.friendRelation.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: relation.receiverId,
          receiverId: relation.requesterId,
        },
      },
    });
    const relationIds = [relation.id, ...(reverse ? [reverse.id] : [])];

    await this.prisma.$transaction([
      this.prisma.memoir.deleteMany({
        where: { friendRelationId: { in: relationIds } },
      }),
      this.prisma.moment.deleteMany({
        where: { friendRelationId: { in: relationIds } },
      }),
      this.prisma.friendRelation.deleteMany({
        where: { id: { in: relationIds } },
      }),
    ]);

    return '删除简单，朋友难得。千万不要因为一些小事，失去一个要好的朋友！';
  }

  async updateBlockState(
    currentUserId: bigint,
    relationId: string,
    dto: UpdateFriendBlockDto,
  ): Promise<string> {
    const relation = await this.findOwnedRelationOrThrow(
      currentUserId,
      this.parseId(relationId),
    );

    const reverse = await this.prisma.friendRelation.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: relation.receiverId,
          receiverId: relation.requesterId,
        },
      },
    });

    await this.prisma.$transaction([
      this.prisma.friendRelation.update({
        where: { id: relation.id },
        data: {
          blockState: dto.isBlock
            ? FriendBlockState.REQUESTER_BLOCKED_RECEIVER
            : FriendBlockState.NORMAL,
        },
      }),
      ...(reverse
        ? [
            this.prisma.friendRelation.update({
              where: { id: reverse.id },
              data: {
                blockState: dto.isBlock
                  ? FriendBlockState.RECEIVER_BLOCKED_REQUESTER
                  : FriendBlockState.NORMAL,
              },
            }),
          ]
        : []),
    ]);

    return dto.isBlock
      ? '好友关系建立不易。千万不要因为一些小事，失去一个要好的朋友！'
      : '冤家宜解不宜结。经历风雨的感情，才更加弥足珍贵！';
  }

  async updateAlias(
    currentUserId: bigint,
    relationId: string,
    dto: UpdateFriendAliasDto,
  ): Promise<string> {
    const relation = await this.findOwnedRelationOrThrow(
      currentUserId,
      this.parseId(relationId),
    );

    await this.prisma.friendRelation.update({
      where: { id: relation.id },
      data: { requesterAlias: dto.friendAlias },
    });

    return '修改成功';
  }

  async getMyFriends(
    currentUserId: bigint,
    query: FriendStatusQueryDto,
  ): Promise<PaginatedApiResponseBody<FriendRelationDto[]>> {
    return this.listRelations({
      currentUserId,
      where: {
        requesterId: currentUserId,
        status: { in: query.status ?? [FriendStatus.ACCEPTED] },
      },
      query,
    });
  }

  async getIncomingRequests(
    currentUserId: bigint,
    query: FriendStatusQueryDto,
  ): Promise<PaginatedApiResponseBody<FriendRelationDto[]>> {
    return this.listRelations({
      currentUserId,
      where: {
        receiverId: currentUserId,
        status: {
          in: query.status ?? [
            FriendStatus.REJECTED_BLOCKED,
            FriendStatus.REJECTED,
            FriendStatus.PENDING,
          ],
        },
      },
      query,
    });
  }

  async bindBestFriend(
    currentUserId: bigint,
    relationId: string,
  ): Promise<FriendRelationDto> {
    const target = await this.findOwnedRelationOrThrow(
      currentUserId,
      this.parseId(relationId),
    );
    if (target.status !== FriendStatus.ACCEPTED) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_INVALID,
        '伴友关系异常，请重新登录后再次尝试',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.friendRelation.updateMany({
        where: {
          requesterId: currentUserId,
          status: FriendStatus.ACCEPTED,
          isBestFriend: true,
          NOT: { id: target.id },
        },
        data: { isBestFriend: false },
      });

      return tx.friendRelation.update({
        where: { id: target.id },
        data: { isBestFriend: true },
        include: FRIEND_INCLUDE,
      });
    });

    return toFriendRelationDto(updated, currentUserId);
  }

  private async acceptReverseRequest(
    reverseRelationId: bigint,
    currentUser: User,
    toUser: User,
  ): Promise<FriendRelationWithUsers> {
    const [, currentToTarget] = await this.prisma.$transaction([
      this.prisma.friendRelation.update({
        where: { id: reverseRelationId },
        data: { status: FriendStatus.ACCEPTED },
      }),
      this.prisma.friendRelation.upsert({
        where: {
          requesterId_receiverId: {
            requesterId: currentUser.id,
            receiverId: toUser.id,
          },
        },
        create: {
          requesterId: currentUser.id,
          receiverId: toUser.id,
          status: FriendStatus.ACCEPTED,
        },
        update: { status: FriendStatus.ACCEPTED },
        include: FRIEND_INCLUDE,
      }),
    ]);

    this.pushService.sendAgreeAddFriend({
      deviceType: toUser.pushDeviceType,
      pushAlias: toUser.pushAlias,
      pushAliasType: toUser.pushAliasType,
      fromUserId: currentUser.id,
      fromUserNickname: currentUser.nickname,
      fromUserAvatarUrl: currentUser.avatarUrl,
    });

    return currentToTarget;
  }

  private async listRelations(params: {
    currentUserId: bigint;
    where: Prisma.FriendRelationWhereInput;
    query: FriendStatusQueryDto;
  }): Promise<PaginatedApiResponseBody<FriendRelationDto[]>> {
    const page = params.query.page ?? 1;
    const pageSize = params.query.pageSize ?? 20;
    const [total, relations] = await Promise.all([
      this.prisma.friendRelation.count({ where: params.where }),
      this.prisma.friendRelation.findMany({
        where: params.where,
        include: FRIEND_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.ceil(total / pageSize);

    return {
      code: 200,
      message: 'success',
      data: relations.map((relation) =>
        toFriendRelationDto(relation, params.currentUserId),
      ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        isLast: page >= totalPages,
      },
    };
  }

  private async findRelationOrThrow(
    relationId: bigint,
  ): Promise<FriendRelationWithUsers> {
    const relation = await this.prisma.friendRelation.findUnique({
      where: { id: relationId },
      include: FRIEND_INCLUDE,
    });
    if (!relation) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_NOT_FOUND,
        '好友关系不存在',
        HttpStatus.NOT_FOUND,
      );
    }
    return relation;
  }

  private async findOwnedRelationOrThrow(
    currentUserId: bigint,
    relationId: bigint,
  ): Promise<FriendRelationWithUsers> {
    const relation = await this.findRelationOrThrow(relationId);
    if (relation.requesterId !== currentUserId) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_PERMISSION_DENIED,
        '账户信息出错，请重新登录账号',
        HttpStatus.FORBIDDEN,
      );
    }
    return relation;
  }

  private async findActiveUser(userId: bigint): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE || user.disabledDays > 0) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.CURRENT_USER_INVALID,
        '用户信息异常，请重新登陆',
      );
    }
    return user;
  }

  private assertCanCreateRequestFromExisting(status: FriendStatus): void {
    if (status === FriendStatus.PENDING) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.REQUEST_ALREADY_SENT,
        '已经请求过了',
      );
    }
    if (status === FriendStatus.ACCEPTED) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.ALREADY_FRIENDS,
        '你们已经是密友关系，无法重复操作',
      );
    }
    if (status === FriendStatus.REJECTED_BLOCKED) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.PERMANENTLY_REJECTED,
        '对方永久拒绝您的请求',
      );
    }
  }

  private parseId(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_INVALID,
        '伴友关系异常，请重新登录后再次尝试',
      );
    }
    return BigInt(value);
  }
}

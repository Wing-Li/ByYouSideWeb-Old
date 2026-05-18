import { HttpStatus, Injectable } from '@nestjs/common';
import { FriendRelation, FriendStatus, Prisma } from '@prisma/client';
import { BusinessException } from '../../common/errors/business-exception';
import {
  FRIEND_ERROR_CODES,
  MOMENT_ERROR_CODES,
} from '../../common/errors/error-codes';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { PrismaService } from '../../database/prisma.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { MomentDto } from './dto/moment.dto';
import { MomentQueryDto } from './dto/moment-query.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { MomentWithAuthor, toMomentDto } from './moments.mapper';

const MOMENT_INCLUDE = {
  author: true,
} satisfies Prisma.MomentInclude;

@Injectable()
export class MomentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMoment(
    currentUserId: bigint,
    dto: CreateMomentDto,
  ): Promise<MomentDto> {
    const relation = await this.findOwnedAcceptedRelationOrThrow(
      currentUserId,
      this.parseId(dto.friendRelationId),
    );

    const moment = await this.prisma.moment.create({
      data: {
        friendRelationId: relation.id,
        authorId: currentUserId,
        content: dto.content,
        happenedAt: dto.happenedAt ? new Date(dto.happenedAt) : new Date(),
      },
      include: MOMENT_INCLUDE,
    });

    return toMomentDto(moment);
  }

  async updateMoment(
    currentUserId: bigint,
    momentIdValue: string,
    dto: UpdateMomentDto,
  ): Promise<MomentDto> {
    const moment = await this.findMomentOrThrow(this.parseId(momentIdValue));
    if (moment.authorId !== currentUserId) {
      throw new BusinessException(
        MOMENT_ERROR_CODES.UPDATE_AUTHOR_REQUIRED,
        '此瞬间不是您写的，无法修改',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.prisma.moment.update({
      where: { id: moment.id },
      data: {
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.happenedAt !== undefined
          ? { happenedAt: new Date(dto.happenedAt) }
          : {}),
      },
      include: MOMENT_INCLUDE,
    });

    return toMomentDto(updated);
  }

  async deleteMoment(
    currentUserId: bigint,
    momentIdValue: string,
  ): Promise<string> {
    const moment = await this.findMomentOrThrow(this.parseId(momentIdValue));
    if (moment.authorId !== currentUserId) {
      throw new BusinessException(
        MOMENT_ERROR_CODES.DELETE_AUTHOR_REQUIRED,
        '此瞬间不是您写的，无法删除',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.moment.delete({ where: { id: moment.id } });
    return '删除成功';
  }

  async getMoment(
    currentUserId: bigint,
    momentIdValue: string,
  ): Promise<MomentDto> {
    const moment = await this.findMomentOrThrow(this.parseId(momentIdValue));
    await this.assertCanReadRelation(
      currentUserId,
      moment.friendRelationId,
      MOMENT_ERROR_CODES.RELATION_PERMISSION_REQUIRED,
      '只能查看好友关系内的瞬间',
    );
    return toMomentDto(moment);
  }

  async listMoments(
    currentUserId: bigint,
    query: MomentQueryDto,
  ): Promise<PaginatedApiResponseBody<MomentDto[]>> {
    const relation = await this.findOwnedAcceptedRelationOrThrow(
      currentUserId,
      this.parseId(query.friendRelationId),
    );
    const relationIds = await this.findPairRelationIds(relation);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { friendRelationId: { in: relationIds } };
    const [total, moments] = await Promise.all([
      this.prisma.moment.count({ where }),
      this.prisma.moment.findMany({
        where,
        include: MOMENT_INCLUDE,
        orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.ceil(total / pageSize);

    return {
      code: 200,
      message: 'success',
      data: moments.map(toMomentDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        isLast: page >= totalPages,
      },
    };
  }

  private async findMomentOrThrow(momentId: bigint): Promise<MomentWithAuthor> {
    const moment = await this.prisma.moment.findUnique({
      where: { id: momentId },
      include: MOMENT_INCLUDE,
    });
    if (!moment) {
      throw new BusinessException(
        MOMENT_ERROR_CODES.MOMENT_NOT_FOUND,
        '此瞬间不存在',
        HttpStatus.NOT_FOUND,
      );
    }
    return moment;
  }

  private async findOwnedAcceptedRelationOrThrow(
    currentUserId: bigint,
    relationId: bigint,
  ): Promise<FriendRelation> {
    const relation = await this.prisma.friendRelation.findUnique({
      where: { id: relationId },
    });
    if (!relation) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_NOT_FOUND,
        '好友关系不存在',
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      relation.requesterId !== currentUserId ||
      relation.status !== FriendStatus.ACCEPTED
    ) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_INVALID,
        '伴友关系异常，请重新登录后再次尝试',
        HttpStatus.FORBIDDEN,
      );
    }
    return relation;
  }

  private async assertCanReadRelation(
    currentUserId: bigint,
    relationId: bigint,
    code: number,
    message: string,
  ): Promise<void> {
    const relation = await this.prisma.friendRelation.findUnique({
      where: { id: relationId },
    });
    if (
      !relation ||
      relation.status !== FriendStatus.ACCEPTED ||
      (relation.requesterId !== currentUserId &&
        relation.receiverId !== currentUserId)
    ) {
      throw new BusinessException(code, message, HttpStatus.FORBIDDEN);
    }
  }

  private async findPairRelationIds(
    relation: FriendRelation,
  ): Promise<bigint[]> {
    const reverse = await this.prisma.friendRelation.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: relation.receiverId,
          receiverId: relation.requesterId,
        },
      },
    });
    if (!reverse || reverse.status !== FriendStatus.ACCEPTED) {
      throw new BusinessException(
        FRIEND_ERROR_CODES.RELATION_NOT_FOUND,
        '好友关系不存在',
        HttpStatus.NOT_FOUND,
      );
    }
    return [relation.id, reverse.id];
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

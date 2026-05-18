import { HttpStatus, Injectable } from '@nestjs/common';
import { FriendRelation, FriendStatus, Prisma } from '@prisma/client';
import { BusinessException } from '../../common/errors/business-exception';
import {
  FRIEND_ERROR_CODES,
  MEMOIR_ERROR_CODES,
} from '../../common/errors/error-codes';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { PrismaService } from '../../database/prisma.service';
import { CreateMemoirDto } from './dto/create-memoir.dto';
import { MemoirDto } from './dto/memoir.dto';
import { MemoirQueryDto } from './dto/memoir-query.dto';
import { UpdateMemoirDto } from './dto/update-memoir.dto';
import { MemoirWithAuthor, toMemoirDto } from './memoirs.mapper';

const MEMOIR_INCLUDE = {
  author: true,
} satisfies Prisma.MemoirInclude;

@Injectable()
export class MemoirsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemoir(
    currentUserId: bigint,
    dto: CreateMemoirDto,
  ): Promise<MemoirDto> {
    const relation = await this.findOwnedAcceptedRelationOrThrow(
      currentUserId,
      this.parseId(dto.friendRelationId),
    );

    const memoir = await this.prisma.memoir.create({
      data: {
        friendRelationId: relation.id,
        authorId: currentUserId,
        title: dto.title,
        content: dto.content,
        happenedAt: dto.happenedAt ? new Date(dto.happenedAt) : new Date(),
      },
      include: MEMOIR_INCLUDE,
    });

    return toMemoirDto(memoir);
  }

  async updateMemoir(
    currentUserId: bigint,
    memoirIdValue: string,
    dto: UpdateMemoirDto,
  ): Promise<MemoirDto> {
    const memoir = await this.findMemoirOrThrow(this.parseId(memoirIdValue));
    if (memoir.authorId !== currentUserId) {
      throw new BusinessException(
        MEMOIR_ERROR_CODES.UPDATE_AUTHOR_REQUIRED,
        '此回忆不是您写的，无法修改',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.prisma.memoir.update({
      where: { id: memoir.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.happenedAt !== undefined
          ? { happenedAt: new Date(dto.happenedAt) }
          : {}),
      },
      include: MEMOIR_INCLUDE,
    });

    return toMemoirDto(updated);
  }

  async deleteMemoir(
    currentUserId: bigint,
    memoirIdValue: string,
  ): Promise<string> {
    const memoir = await this.findMemoirOrThrow(this.parseId(memoirIdValue));
    if (memoir.authorId !== currentUserId) {
      throw new BusinessException(
        MEMOIR_ERROR_CODES.DELETE_AUTHOR_REQUIRED,
        '此回忆不是您写的，无法删除',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.memoir.delete({ where: { id: memoir.id } });
    return '删除成功';
  }

  async getMemoir(
    currentUserId: bigint,
    memoirIdValue: string,
  ): Promise<MemoirDto> {
    const memoir = await this.findMemoirOrThrow(this.parseId(memoirIdValue));
    await this.assertCanReadRelation(
      currentUserId,
      memoir.friendRelationId,
      MEMOIR_ERROR_CODES.RELATION_PERMISSION_REQUIRED,
      '只能查看好友关系内的回忆',
    );
    return toMemoirDto(memoir);
  }

  async listMemoirs(
    currentUserId: bigint,
    query: MemoirQueryDto,
  ): Promise<PaginatedApiResponseBody<MemoirDto[]>> {
    const relation = await this.findOwnedAcceptedRelationOrThrow(
      currentUserId,
      this.parseId(query.friendRelationId),
    );
    const relationIds = await this.findPairRelationIds(relation);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { friendRelationId: { in: relationIds } };
    const [total, memoirs] = await Promise.all([
      this.prisma.memoir.count({ where }),
      this.prisma.memoir.findMany({
        where,
        include: MEMOIR_INCLUDE,
        orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.ceil(total / pageSize);

    return {
      code: 200,
      message: 'success',
      data: memoirs.map(toMemoirDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        isLast: page >= totalPages,
      },
    };
  }

  private async findMemoirOrThrow(memoirId: bigint): Promise<MemoirWithAuthor> {
    const memoir = await this.prisma.memoir.findUnique({
      where: { id: memoirId },
      include: MEMOIR_INCLUDE,
    });
    if (!memoir) {
      throw new BusinessException(
        MEMOIR_ERROR_CODES.MEMOIR_NOT_FOUND,
        '此回忆不存在',
        HttpStatus.NOT_FOUND,
      );
    }
    return memoir;
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

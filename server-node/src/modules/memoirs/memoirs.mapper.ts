import { Memoir, User } from '@prisma/client';
import { toUserProfileDto } from '../users/users.mapper';
import { MemoirDto } from './dto/memoir.dto';

export type MemoirWithAuthor = Memoir & {
  author: User;
};

export function toMemoirDto(memoir: MemoirWithAuthor): MemoirDto {
  return {
    id: memoir.id.toString(),
    friendRelationId: memoir.friendRelationId.toString(),
    authorId: memoir.authorId.toString(),
    author: toUserProfileDto(memoir.author),
    title: memoir.title,
    content: memoir.content,
    happenedAt: memoir.happenedAt.toISOString(),
    createdAt: memoir.createdAt.toISOString(),
    updatedAt: memoir.updatedAt.toISOString(),
  };
}

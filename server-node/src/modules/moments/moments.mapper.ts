import { Moment, User } from '@prisma/client';
import { toUserProfileDto } from '../users/users.mapper';
import { MomentDto } from './dto/moment.dto';

export type MomentWithAuthor = Moment & {
  author: User;
};

export function toMomentDto(moment: MomentWithAuthor): MomentDto {
  return {
    id: moment.id.toString(),
    friendRelationId: moment.friendRelationId.toString(),
    authorId: moment.authorId.toString(),
    author: toUserProfileDto(moment.author),
    content: moment.content,
    happenedAt: moment.happenedAt.toISOString(),
    createdAt: moment.createdAt.toISOString(),
    updatedAt: moment.updatedAt.toISOString(),
  };
}

import { FriendRelation, User } from '@prisma/client';
import { toUserProfileDto } from '../users/users.mapper';
import { FriendRelationDto } from './dto/friend-relation.dto';

export type FriendRelationWithUsers = FriendRelation & {
  requester: User;
  receiver: User;
};

export function toFriendRelationDto(
  relation: FriendRelationWithUsers,
  currentUserId: bigint,
): FriendRelationDto {
  const friend =
    relation.requesterId === currentUserId
      ? relation.receiver
      : relation.requester;

  return {
    id: relation.id.toString(),
    requesterId: relation.requesterId.toString(),
    receiverId: relation.receiverId.toString(),
    requesterAlias: relation.requesterAlias,
    receiverAlias: relation.receiverAlias,
    isBestFriend: relation.isBestFriend,
    status: relation.status,
    blockState: relation.blockState,
    friend: toUserProfileDto(friend),
    createdAt: relation.createdAt.toISOString(),
    updatedAt: relation.updatedAt.toISOString(),
  };
}

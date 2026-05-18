import { Injectable, Logger } from '@nestjs/common';

export type FriendPushPayload = {
  deviceType: string | null;
  pushAlias: string | null;
  pushAliasType: string | null;
  fromUserId: bigint;
  fromUserNickname: string;
  fromUserAvatarUrl: string;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  sendRequestAddFriend(payload: FriendPushPayload): void {
    this.logFriendPush('requestAddFriend', payload);
  }

  sendAgreeAddFriend(payload: FriendPushPayload): void {
    this.logFriendPush('agreeAddFriend', payload);
  }

  sendRequestLocation(payload: FriendPushPayload): void {
    this.logFriendPush('requestLocation', payload);
  }

  sendBindVip(payload: FriendPushPayload): void {
    this.logFriendPush('bindVip', payload);
  }

  private logFriendPush(type: string, payload: FriendPushPayload): void {
    if (!payload.pushAlias || !payload.pushAliasType || !payload.deviceType) {
      return;
    }

    this.logger.log(
      `mock push ${type} to ${payload.deviceType}/${payload.pushAliasType}/${payload.pushAlias} from user ${payload.fromUserId.toString()}`,
    );
  }
}

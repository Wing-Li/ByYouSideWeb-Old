import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type FriendPushPayload = {
  deviceType: string | null;
  pushAlias: string | null;
  pushAliasType: string | null;
  fromUserId: bigint;
  fromUserNickname: string;
  fromUserAvatarUrl: string;
};

type PushMode = 'log' | 'umeng';
type PushKind =
  | 'requestLocation'
  | 'requestAddFriend'
  | 'agreeAddFriend'
  | 'bindVip';
type DisplayType = 'notification' | 'message';
type Platform = 'android' | 'ios';

type PushText = {
  title: string;
  text: string;
};

type UmengConfig = {
  androidAppKey: string;
  androidMasterSecret: string;
  iosAppKey: string;
  iosMasterSecret: string;
  sendUrl: string;
  timeoutMs: number;
};

const CONFIG_PLACEHOLDER_PATTERN = /^<|replace-with|example/i;

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendRequestAddFriend(payload: FriendPushPayload): Promise<void> {
    await this.sendBusinessPush('requestAddFriend', payload);
  }

  async sendAgreeAddFriend(payload: FriendPushPayload): Promise<void> {
    await this.sendBusinessPush('agreeAddFriend', payload);
  }

  async sendRequestLocation(payload: FriendPushPayload): Promise<void> {
    await this.sendBusinessPush('requestLocation', payload);
  }

  async sendBindVip(payload: FriendPushPayload): Promise<void> {
    await this.sendBusinessPush('bindVip', payload);
  }

  private async sendBusinessPush(
    kind: PushKind,
    payload: FriendPushPayload,
  ): Promise<void> {
    if (!payload.pushAlias || !payload.pushAliasType || !payload.deviceType) {
      return;
    }

    const mode = this.getMode();
    if (mode !== 'umeng') {
      this.logger.log(
        `mock push ${kind} to ${payload.deviceType}/${payload.pushAliasType}/${this.mask(payload.pushAlias)} from user ${payload.fromUserId.toString()}`,
      );
      return;
    }

    const platform = this.getPlatform(payload.deviceType);
    const messages = this.createMessages(kind, platform, payload);
    for (const body of messages) {
      await this.sendUmeng(body, platform);
    }
  }

  private getMode(): PushMode {
    const mode = this.configService.get<string>('PUSH_MODE') ?? 'log';
    if (mode === 'umeng') {
      return mode;
    }
    return 'log';
  }

  private getPlatform(deviceType: string): Platform {
    return deviceType.toLowerCase() === 'ios' ? 'ios' : 'android';
  }

  private createMessages(
    kind: PushKind,
    platform: Platform,
    payload: FriendPushPayload,
  ): string[] {
    const text = this.getPushText(kind, payload.fromUserNickname);
    if (kind === 'requestLocation') {
      return platform === 'ios'
        ? [this.createIosBody('message', kind, text, payload)]
        : [
            this.createAndroidBody('notification', kind, text, payload),
            this.createAndroidBody('message', kind, text, payload),
          ];
    }

    if (kind === 'requestAddFriend' || kind === 'agreeAddFriend') {
      return platform === 'ios'
        ? [this.createIosBody('notification', kind, text, payload)]
        : [
            this.createAndroidBody('message', kind, text, payload),
            this.createAndroidBody('notification', kind, text, payload),
          ];
    }

    return platform === 'ios'
      ? [this.createIosBody('notification', kind, text, payload)]
      : [this.createAndroidBody('notification', kind, text, payload)];
  }

  private createAndroidBody(
    displayType: DisplayType,
    kind: PushKind,
    text: PushText,
    payload: FriendPushPayload,
  ): string {
    const extra = this.createCustomPayload(kind, payload);
    return JSON.stringify({
      appKey: this.requireConfig('UMENG_ANDROID_APP_KEY'),
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: 'customizedcast',
      alias_type: payload.pushAliasType,
      alias: payload.pushAlias,
      payload: {
        display_type: displayType,
        body: {
          title: text.title,
          text: text.text,
          after_open: 'go_app',
          custom: extra,
        },
        extra,
      },
      policy: {
        out_biz_no: this.createOutBizNo(),
      },
      production_mode: this.isProdAlias(payload.pushAlias) ? 'true' : 'false',
      description: text.text,
      mipush: 'true',
      mi_activity: 'com.lyl.byyourside.MainActivity',
      channel_properties: {
        channel_activity: 'com.umeng.message.UmengOfflineMessageActivity',
        main_activity: 'com.lyl.byyourside.MainActivity',
        xiaomi_channel_id: '',
        vivo_category: '1',
        oppo_channel_id: 'service_reminder',
        huawei_channel_importance: 'NORMAL',
        huawei_channel_category: 'WORK',
      },
    });
  }

  private createIosBody(
    _displayType: DisplayType,
    kind: PushKind,
    text: PushText,
    payload: FriendPushPayload,
  ): string {
    const extra = this.createCustomPayload(kind, payload);
    return JSON.stringify({
      appKey: this.requireConfig('UMENG_IOS_APP_KEY'),
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: 'customizedcast',
      alias_type: payload.pushAliasType,
      alias: payload.pushAlias,
      payload: {
        aps: {
          alert: {
            title: text.title,
            subtitle: text.text,
          },
          badge: '+1',
        },
        custom: extra,
        extra,
      },
      policy: {
        out_biz_no: this.createOutBizNo(),
      },
      production_mode: this.isProdAlias(payload.pushAlias) ? 'true' : 'false',
      description: text.text,
    });
  }

  private createCustomPayload(
    kind: PushKind,
    payload: FriendPushPayload,
  ): Record<string, string> {
    return {
      fromUserId: payload.fromUserId.toString(),
      fromUserNickName: payload.fromUserNickname,
      fromUserIcon: payload.fromUserAvatarUrl,
      type: kind,
    };
  }

  private getPushText(kind: PushKind, nickname: string): PushText {
    switch (kind) {
      case 'requestLocation':
        return {
          title: `${nickname} 查看了你`,
          text: 'Ta 好像想你了，快去看看吧~~',
        };
      case 'requestAddFriend':
        return {
          title: '请求添加好友',
          text: `${nickname} 请求添加您为伴友，快去查看吧`,
        };
      case 'agreeAddFriend':
        return {
          title: `${nickname} 同意了您的好友请求`,
          text: '快去看看 TA 的最新状态吧',
        };
      case 'bindVip':
        return {
          title: `${nickname} 为你开通了 VIP`,
          text: '真真爱了，快重启 App 体验会员吧~~',
        };
    }
  }

  private async sendUmeng(body: string, platform: Platform): Promise<void> {
    const config = this.getUmengConfig();
    const masterSecret =
      platform === 'ios' ? config.iosMasterSecret : config.androidMasterSecret;
    const sign = createHash('md5')
      .update(`POST${config.sendUrl}${body}${masterSecret}`)
      .digest('hex');
    const response = await fetch(`${config.sendUrl}?sign=${sign}`, {
      method: 'POST',
      headers: {
        'User-Agent': 'ByYouSide-Node/1.0',
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!response.ok) {
      const responseText = await response.text();
      this.logger.error(
        `友盟推送失败：${response.status} ${responseText.slice(0, 300)}`,
      );
      throw new Error(`友盟推送失败：${response.status}`);
    }
  }

  private getUmengConfig(): UmengConfig {
    return {
      androidAppKey: this.requireConfig('UMENG_ANDROID_APP_KEY'),
      androidMasterSecret: this.requireConfig(
        'UMENG_ANDROID_APP_MASTER_SECRET',
      ),
      iosAppKey: this.requireConfig('UMENG_IOS_APP_KEY'),
      iosMasterSecret: this.requireConfig('UMENG_IOS_APP_MASTER_SECRET'),
      sendUrl:
        this.configService.get<string>('UMENG_SEND_URL')?.trim() ??
        'https://msgapi.umeng.com/api/send',
      timeoutMs: this.getNumberConfig('UMENG_TIMEOUT_MS', 30000),
    };
  }

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value || CONFIG_PLACEHOLDER_PATTERN.test(value)) {
      throw new Error(`友盟推送配置缺失或不是真实可用值：${key}`);
    }
    return value;
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = this.configService.get<string>(key);
    if (!value) {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`友盟推送配置不是有效数字：${key}`);
    }
    return parsed;
  }

  private createOutBizNo(): string {
    return `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
  }

  private isProdAlias(alias: string | null): boolean {
    return alias?.startsWith('push_prod') ?? false;
  }

  private mask(value: string): string {
    if (value.length <= 6) {
      return '***';
    }
    return `${value.slice(0, 3)}***${value.slice(-3)}`;
  }
}

import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PushService } from './push.service';

const TEST_ANDROID_APP_KEY = 'unit-test-android-app-key';
const TEST_ANDROID_MASTER_SECRET = 'unit-test-android-master-secret';
const TEST_IOS_APP_KEY = 'unit-test-ios-app-key';
const TEST_IOS_MASTER_SECRET = 'unit-test-ios-master-secret';
const TEST_UMENG_SEND_URL = 'https://msgapi.unit-test.local/api/send';
const TEST_AVATAR_URL = 'https://assets.unit-test.local/avatar.png';

describe('PushService', () => {
  const payload = {
    deviceType: 'android',
    pushAlias: 'push_prod_device_abcdef',
    pushAliasType: 'push_normal',
    fromUserId: 1001n,
    fromUserNickname: 'Alice',
    fromUserAvatarUrl: TEST_AVATAR_URL,
  };

  const createConfig = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('log 模式不会发起外部请求，并会脱敏设备别名', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));
    const service = new PushService(createConfig({ PUSH_MODE: 'log' }));
    const loggerSpy = jest
      .spyOn(
        (service as unknown as { logger: { log: jest.Mock } }).logger,
        'log',
      )
      .mockImplementation();

    await service.sendRequestAddFriend(payload);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(loggerSpy.mock.calls.join('\n')).toContain('pus***def');
    expect(loggerSpy.mock.calls.join('\n')).not.toContain(
      'push_prod_device_abcdef',
    );
  });

  it('umeng 模式会按旧签名规则发送 Android 好友申请消息和通知', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    const service = new PushService(
      createConfig({
        PUSH_MODE: 'umeng',
        UMENG_ANDROID_APP_KEY: TEST_ANDROID_APP_KEY,
        UMENG_ANDROID_APP_MASTER_SECRET: TEST_ANDROID_MASTER_SECRET,
        UMENG_IOS_APP_KEY: TEST_IOS_APP_KEY,
        UMENG_IOS_APP_MASTER_SECRET: TEST_IOS_MASTER_SECRET,
        UMENG_SEND_URL: TEST_UMENG_SEND_URL,
        UMENG_TIMEOUT_MS: '30000',
      }),
    );

    await service.sendRequestAddFriend(payload);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [firstUrl, firstRequest] = fetchSpy.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const firstBody = firstRequest.body as string;
    const expectedSign = createHash('md5')
      .update(
        `POST${TEST_UMENG_SEND_URL}${firstBody}${TEST_ANDROID_MASTER_SECRET}`,
      )
      .digest('hex');
    expect(firstUrl).toBe(`${TEST_UMENG_SEND_URL}?sign=${expectedSign}`);

    const body = JSON.parse(firstBody) as {
      appKey: string;
      type: string;
      alias: string;
      payload: {
        display_type: string;
        extra: Record<string, string>;
      };
      production_mode: string;
    };
    expect(body.appKey).toBe(TEST_ANDROID_APP_KEY);
    expect(body.type).toBe('customizedcast');
    expect(body.alias).toBe('push_prod_device_abcdef');
    expect(body.payload.display_type).toBe('message');
    expect(body.payload.extra).toMatchObject({
      fromUserId: '1001',
      fromUserNickName: 'Alice',
      fromUserIcon: TEST_AVATAR_URL,
      type: 'requestAddFriend',
    });
    expect(body.production_mode).toBe('true');
  });

  it('umeng 模式缺少配置时会给出明确错误', async () => {
    const service = new PushService(createConfig({ PUSH_MODE: 'umeng' }));

    await expect(service.sendBindVip(payload)).rejects.toThrow(
      '友盟推送配置缺失或不是真实可用值：UMENG_ANDROID_APP_KEY',
    );
  });
});

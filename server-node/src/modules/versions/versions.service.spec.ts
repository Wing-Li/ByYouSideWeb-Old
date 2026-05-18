import { UserRole } from '@prisma/client';
import { VersionsService } from './versions.service';

describe('VersionsService', () => {
  it('管理员可以发布版本', async () => {
    const releasedAt = new Date('2026-05-18T00:00:00.000Z');
    const prisma = {
      appVersion: {
        create: jest.fn().mockResolvedValue({
          id: 1n,
          title: '1.2.0 发布',
          description: '优化设备状态同步。',
          androidVersionName: '1.2.0',
          iosVersionName: '1.2.0',
          androidDownloadUrl: 'https://example.com/android.apk',
          iosDownloadUrl: 'https://apps.apple.com/app/id0000000000',
          forceUpdate: false,
          releasedAt,
        }),
      },
    };
    const service = new VersionsService(prisma as never);

    const result = await service.createVersion(UserRole.ADMIN, {
      title: '1.2.0 发布',
      description: '优化设备状态同步。',
      androidVersionName: '1.2.0',
      iosVersionName: '1.2.0',
      androidDownloadUrl: 'https://example.com/android.apk',
      iosDownloadUrl: 'https://apps.apple.com/app/id0000000000',
      forceUpdate: false,
    });

    expect(result).toMatchObject({
      id: '1',
      androidVersionName: '1.2.0',
      forceUpdate: false,
    });
  });

  it('没有版本时返回业务错误', async () => {
    const prisma = {
      appVersion: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new VersionsService(prisma as never);

    await expect(service.getLatestVersion()).rejects.toMatchObject({
      response: { code: 19004 },
    });
  });
});

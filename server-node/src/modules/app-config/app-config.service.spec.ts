import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole, VipPlanStatus } from '@prisma/client';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  it('管理员可以创建或更新当前环境配置并附带 VIP 套餐', async () => {
    const now = new Date('2026-05-18T00:00:00.000Z');
    const prisma = {
      appConfig: {
        upsert: jest.fn().mockResolvedValue({
          id: 1n,
          environment: 'test',
          appName: '伴你左右测试版',
          unCheckMode: true,
          createdAt: now,
          updatedAt: now,
        }),
      },
      vipPlan: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            name: '连续包月',
            description: '',
            level: 1,
            durationMonths: 1,
            price: new Prisma.Decimal('18.80'),
            productCode: 'com.lyl.byyourside.vip.month.1',
            status: VipPlanStatus.ACTIVE,
            createdAt: now,
            updatedAt: now,
          },
        ]),
      },
    };
    const configService = {
      get: jest.fn().mockReturnValue('test'),
    } as unknown as ConfigService;
    const service = new AppConfigService(prisma as never, configService);

    const result = await service.updateAppConfig(UserRole.ADMIN, {
      appName: '伴你左右测试版',
      unCheckMode: true,
    });

    expect(result).toMatchObject({
      environment: 'test',
      appName: '伴你左右测试版',
      unCheckMode: true,
      vipTypeList: [{ productCode: 'com.lyl.byyourside.vip.month.1' }],
    });
    expect(prisma.appConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { environment: 'test' },
      }),
    );
  });

  it('普通用户不能更新配置', async () => {
    const service = new AppConfigService({} as never, {} as ConfigService);

    await expect(
      service.updateAppConfig(UserRole.USER, { appName: '不应成功' }),
    ).rejects.toMatchObject({ response: { code: 10003 } });
  });
});

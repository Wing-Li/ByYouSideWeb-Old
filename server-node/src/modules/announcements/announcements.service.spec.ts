import { UserRole } from '@prisma/client';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsService', () => {
  it('管理员可以创建公告并返回作者信息', async () => {
    const now = new Date('2026-05-18T00:00:00.000Z');
    const prisma = {
      announcement: {
        create: jest.fn().mockResolvedValue({
          id: 1n,
          authorId: 2n,
          title: '系统维护通知',
          authorName: '管理员',
          content: '今晚 23:00 进行系统维护。',
          createdAt: now,
          updatedAt: now,
        }),
      },
    };
    const service = new AnnouncementsService(prisma as never);

    const result = await service.createAnnouncement(2n, UserRole.ADMIN, {
      title: '系统维护通知',
      authorName: '管理员',
      content: '今晚 23:00 进行系统维护。',
    });

    expect(result).toMatchObject({
      id: '1',
      authorId: '2',
      title: '系统维护通知',
    });
  });

  it('普通用户不能创建公告', async () => {
    const service = new AnnouncementsService({} as never);

    await expect(
      service.createAnnouncement(1n, UserRole.USER, {
        title: '不应成功',
        content: '普通用户不能发布公告。',
      }),
    ).rejects.toMatchObject({ response: { code: 10003 } });
  });
});

import { UserRole } from '@prisma/client';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  it('当前用户可以提交反馈', async () => {
    const prisma = {
      feedback: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new FeedbackService(prisma as never);

    await expect(
      service.createFeedback(1n, { content: '希望增加夜间模式。' }),
    ).resolves.toBe('提交成功');
    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        userId: 1n,
        content: '希望增加夜间模式。',
      },
    });
  });

  it('普通用户不能查看全部反馈', async () => {
    const service = new FeedbackService({} as never);

    await expect(
      service.listFeedback(UserRole.USER, { page: 1, pageSize: 20 }),
    ).rejects.toMatchObject({ response: { code: 10003 } });
  });
});

import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

type SentMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

const TEST_RECIPIENT_EMAIL = 'alice@unit-test.local';
const TEST_SMTP_HOST = 'smtp.unit-test.local';
const TEST_SMTP_USER = 'mailer@unit-test.local';
const TEST_SMTP_PASS = 'unit-test-mail-auth-code';
const TEST_SMTP_FROM = `伴你左右 <${TEST_SMTP_USER}>`;

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('MailService', () => {
  const createConfig = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('log 模式不会创建 SMTP transport，也不会记录验证码明文', async () => {
    const service = new MailService(createConfig({ MAIL_MODE: 'log' }));
    const loggerSpy = jest
      .spyOn(
        (service as unknown as { logger: { log: jest.Mock } }).logger,
        'log',
      )
      .mockImplementation();

    await service.sendPasswordResetCode(TEST_RECIPIENT_EMAIL, '1234');

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(
      `开发模式邮件：准备向 ${TEST_RECIPIENT_EMAIL} 发送密码重置验证码。`,
    );
    expect(loggerSpy.mock.calls.join('\n')).not.toContain('1234');
  });

  it('smtp 模式会使用环境变量发送 HTML 验证码邮件', async () => {
    const sendMail = jest.fn<Promise<void>, [SentMail]>().mockResolvedValue();
    jest
      .mocked(nodemailer.createTransport)
      .mockReturnValue({ sendMail } as never);
    const service = new MailService(
      createConfig({
        MAIL_MODE: 'smtp',
        SMTP_HOST: TEST_SMTP_HOST,
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_USER: TEST_SMTP_USER,
        SMTP_PASS: TEST_SMTP_PASS,
        SMTP_FROM: TEST_SMTP_FROM,
      }),
    );

    await service.sendPasswordResetCode(TEST_RECIPIENT_EMAIL, '9876');

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: TEST_SMTP_HOST,
      port: 465,
      secure: true,
      auth: { user: TEST_SMTP_USER, pass: TEST_SMTP_PASS },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    const [mail] = sendMail.mock.calls[0];
    expect(mail.from).toBe(TEST_SMTP_FROM);
    expect(mail.to).toBe(TEST_RECIPIENT_EMAIL);
    expect(mail.subject).toBe('【伴你左右】验证码');
    expect(mail.html).toContain('9');
  });

  it('smtp 模式缺少必要配置时会给出明确错误', async () => {
    const service = new MailService(createConfig({ MAIL_MODE: 'smtp' }));

    await expect(
      service.sendPasswordResetCode(TEST_RECIPIENT_EMAIL, '1234'),
    ).rejects.toThrow('SMTP 配置缺失或不是真实可用值：SMTP_HOST');
  });
});

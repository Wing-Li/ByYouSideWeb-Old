import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type MailMode = 'log' | 'smtp';
const CONFIG_PLACEHOLDER_PATTERN =
  /^<|replace-with|noreply@example\.com|smtp-pass/i;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const mode = this.getMode();
    if (mode !== 'smtp') {
      this.logger.log(`开发模式邮件：准备向 ${email} 发送密码重置验证码。`);
      return;
    }

    await this.getTransporter().sendMail({
      from: this.getFromAddress(),
      to: email,
      subject: '【伴你左右】验证码',
      html: this.renderVerificationCodeHtml(code),
    });
  }

  private getMode(): MailMode {
    const mode = this.configService.get<string>('MAIL_MODE') ?? 'log';
    if (mode === 'smtp') {
      return mode;
    }
    return 'log';
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.requireConfig('SMTP_HOST');
    const port = this.getNumberConfig('SMTP_PORT', 465);
    const secure = this.getBooleanConfig('SMTP_SECURE', port === 465);
    const user = this.requireConfig('SMTP_USER');
    const pass = this.requireConfig('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return this.transporter;
  }

  private getFromAddress(): string {
    const from = this.configService.get<string>('SMTP_FROM')?.trim();
    if (from) {
      return from;
    }
    const user = this.requireConfig('SMTP_USER');
    return `伴你左右 <${user}>`;
  }

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value || CONFIG_PLACEHOLDER_PATTERN.test(value)) {
      throw new Error(`SMTP 配置缺失或不是真实可用值：${key}`);
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
      throw new Error(`SMTP 配置不是有效数字：${key}`);
    }
    return parsed;
  }

  private getBooleanConfig(key: string, fallback: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === '') {
      return fallback;
    }
    return value === 'true';
  }

  private renderVerificationCodeHtml(code: string): string {
    const digits = code
      .split('')
      .map(
        (digit) =>
          `<span style="display:inline-block;margin:0 6px;padding:12px 16px;border-radius:12px;background:#f3f3f3;color:#fe4f70;font-size:32px;font-weight:700;">${digit}</span>`,
      )
      .join('');

    return `
      <!doctype html>
      <html lang="zh-CN">
        <body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,'Microsoft YaHei',sans-serif;color:#4d4d4d;">
          <main style="max-width:680px;margin:0 auto;">
            <h1 style="font-size:18px;color:#fe4f70;">伴你左右验证码</h1>
            <p>尊敬的用户，您好：</p>
            <p>您正在使用验证码校验，请在 5 分钟内填写如下验证码。如非本人操作，请忽略该邮件。</p>
            <div style="margin:28px 0;text-align:center;">${digits}</div>
            <p style="font-size:12px;color:#747474;">工作人员不会向您索取此验证码，请勿泄露。</p>
            <p style="text-align:right;color:#fe4f70;font-weight:700;">《伴你左右》官方</p>
          </main>
        </body>
      </html>
    `;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  sendPasswordResetCode(email: string, code: string): void {
    void code;
    const mode = this.configService.get<string>('MAIL_MODE') ?? 'log';
    if (mode !== 'smtp') {
      this.logger.log(`开发模式邮件：向 ${email} 发送密码重置验证码。`);
      return;
    }

    throw new Error('真实 SMTP 邮件发送将在 Phase 9 接入');
  }
}

import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UserStatus, VerificationPurpose } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JwtTokenService } from '../../common/auth/jwt-token.service';
import { BusinessException } from '../../common/errors/business-exception';
import { AUTH_ERROR_CODES } from '../../common/errors/error-codes';
import { MailService } from '../../integrations/mail/mail.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetCodeDto } from './dto/password-reset-code.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { RegisterDto } from './dto/register.dto';
import { toUserProfileDto } from '../users/users.mapper';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;
const VERIFICATION_RESEND_INTERVAL_MS = 60 * 1000;
const VERIFICATION_EXPIRES_MS = 5 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    if (!USERNAME_REGEX.test(dto.username)) {
      throw new BusinessException(
        AUTH_ERROR_CODES.INVALID_USERNAME,
        '用户名必须是 4-20 位的字母、数字或下划线组合',
      );
    }

    await this.assertUsernameAvailable(dto.username);
    await this.assertEmailAvailable(email);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email,
        passwordHash,
      },
    });

    return {
      token: this.jwtTokenService.sign(user.id),
      user: toUserProfileDto(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const identity = dto.usernameOrEmail.trim();
    if (!identity || !dto.password) {
      throw new BusinessException(
        AUTH_ERROR_CODES.LOGIN_FIELDS_REQUIRED,
        '用户名和密码不能为空',
      );
    }

    const normalizedIdentity = identity.includes('@')
      ? this.normalizeEmail(identity)
      : identity;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identity }, { email: normalizedIdentity }],
      },
    });
    if (!user) {
      throw new BusinessException(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        '没有此用户',
      );
    }

    const passwordMatched = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatched) {
      throw new BusinessException(
        AUTH_ERROR_CODES.PASSWORD_INCORRECT,
        '密码错误',
      );
    }
    this.assertUserCanLogin(user);

    return {
      token: this.jwtTokenService.sign(user.id),
      user: toUserProfileDto(user),
    };
  }

  async sendPasswordResetCode(dto: PasswordResetCodeDto): Promise<string> {
    const user = await this.findUserByResetIdentity(dto);
    const latestCode = await this.prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        purpose: VerificationPurpose.PASSWORD_RESET,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latestCode &&
      Date.now() - latestCode.createdAt.getTime() <
        VERIFICATION_RESEND_INTERVAL_MS
    ) {
      throw new BusinessException(
        AUTH_ERROR_CODES.VERIFICATION_CODE_TOO_FREQUENT,
        '验证码已发送，请耐心等待',
      );
    }

    const code = randomInt(0, 10000).toString().padStart(4, '0');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    await this.prisma.verificationCode.create({
      data: {
        userId: user.id,
        email: user.email,
        codeHash,
        purpose: VerificationPurpose.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + VERIFICATION_EXPIRES_MS),
      },
    });

    this.mailService.sendPasswordResetCode(user.email, code);
    return `验证码已发送至：${user.email}`;
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto): Promise<string> {
    const user = await this.findUserByResetIdentity(dto);
    const latestCode = await this.prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        purpose: VerificationPurpose.PASSWORD_RESET,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestCode || latestCode.expiresAt.getTime() <= Date.now()) {
      throw new BusinessException(
        AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED,
        '验证码已过期，请重新发送',
      );
    }

    const codeMatched = await bcrypt.compare(
      dto.verifyCode,
      latestCode.codeHash,
    );
    if (!codeMatched) {
      throw new BusinessException(
        AUTH_ERROR_CODES.VERIFICATION_CODE_INVALID,
        '验证码错误，请仔细确认',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.verificationCode.update({
        where: { id: latestCode.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return '密码修改成功，快去登录吧 (#^.^#)';
  }

  private async assertUsernameAvailable(username: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({ where: { username } });
    if (exists) {
      throw new BusinessException(
        AUTH_ERROR_CODES.USERNAME_EXISTS,
        '用户名已经存在',
      );
    }
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new BusinessException(
        AUTH_ERROR_CODES.EMAIL_EXISTS,
        '邮箱已经存在，邮箱为修改密码必备，请慎重填写！',
      );
    }
  }

  private async findUserByResetIdentity(
    dto: PasswordResetCodeDto | PasswordResetConfirmDto,
  ) {
    if (!dto.username && !dto.email) {
      throw new BusinessException(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        '没有此用户',
      );
    }

    const email = dto.email ? this.normalizeEmail(dto.email) : undefined;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.username ? [{ username: dto.username }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (!user) {
      throw new BusinessException(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        '没有此用户',
      );
    }
    return user;
  }

  private assertUserCanLogin(user: {
    status: UserStatus;
    disabledDays: number;
    destroyRequestedAt: Date | null;
  }): void {
    if (user.status === UserStatus.DESTROYED) {
      throw new BusinessException(
        AUTH_ERROR_CODES.ACCOUNT_DESTROYED,
        '账号已注销',
      );
    }
    if (user.status === UserStatus.DESTROY_REQUESTED) {
      throw new BusinessException(
        AUTH_ERROR_CODES.DESTROY_REQUESTED,
        '账号已申请注销，请先取消注销申请',
      );
    }
    if (user.status === UserStatus.DISABLED || user.disabledDays > 0) {
      throw new BusinessException(
        AUTH_ERROR_CODES.ACCOUNT_DISABLED,
        `账号被限制登录 ${user.disabledDays} 天`,
      );
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

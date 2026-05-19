import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { COMMON_ERROR_CODES } from '../errors/error-codes';
import { JwtPayload } from './auth.types';

const CONFIG_PLACEHOLDER_PATTERN =
  /^(<|replace-with|change-me|development-only|example)/i;

@Injectable()
export class JwtTokenService {
  constructor(private readonly configService: ConfigService) {}

  sign(userId: bigint): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresIn = this.getExpiresInSeconds();
    const payload: JwtPayload = {
      sub: userId.toString(),
      iat: issuedAt,
      exp: issuedAt + expiresIn,
    };

    const encodedHeader = this.base64UrlEncode(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.signData(`${encodedHeader}.${encodedPayload}`);

    return `Bearer ${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string | undefined): JwtPayload {
    if (!token) {
      throw this.unauthorized('缺少登录令牌');
    }

    const rawToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const [encodedHeader, encodedPayload, signature] = rawToken.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw this.unauthorized('登录令牌格式不正确');
    }

    const expectedSignature = this.signData(
      `${encodedHeader}.${encodedPayload}`,
    );
    if (!this.safeEqual(signature, expectedSignature)) {
      throw this.unauthorized('登录令牌无效');
    }

    const payload = this.parsePayload(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      throw this.unauthorized('登录已过期，请重新登录');
    }

    return payload;
  }

  private parsePayload(encodedPayload: string): JwtPayload {
    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as Partial<JwtPayload>;
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.iat !== 'number' ||
        typeof payload.exp !== 'number'
      ) {
        throw new Error('invalid payload');
      }
      return payload as JwtPayload;
    } catch {
      throw this.unauthorized('登录令牌内容不正确');
    }
  }

  private signData(data: string): string {
    return createHmac('sha256', this.getSecret())
      .update(data)
      .digest('base64url');
  }

  private getSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET')?.trim();
    if (!secret || CONFIG_PLACEHOLDER_PATTERN.test(secret)) {
      throw new Error('JWT_SECRET 未配置为真实可用值');
    }
    return secret;
  }

  private getExpiresInSeconds(): number {
    const value = this.configService
      .get<string>('JWT_EXPIRES_IN_SECONDS')
      ?.trim();
    if (!value) {
      throw new Error('JWT_EXPIRES_IN_SECONDS 未配置');
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new Error('JWT_EXPIRES_IN_SECONDS 必须是正整数秒数');
    }
    return parsed;
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.byteLength !== rightBuffer.byteLength) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private unauthorized(message: string): UnauthorizedException {
    return new UnauthorizedException({
      code: COMMON_ERROR_CODES.UNAUTHORIZED,
      message,
    });
  }
}

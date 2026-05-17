import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { COMMON_ERROR_CODES } from '../errors/error-codes';
import { JwtPayload } from './auth.types';

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;

@Injectable()
export class JwtTokenService {
  constructor(private readonly configService: ConfigService) {}

  sign(userId: bigint): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresIn =
      Number(this.configService.get<string>('JWT_EXPIRES_IN_SECONDS')) ||
      DEFAULT_EXPIRES_IN_SECONDS;
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
    return (
      this.configService.get<string>('JWT_SECRET') ??
      'development-only-change-me'
    );
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

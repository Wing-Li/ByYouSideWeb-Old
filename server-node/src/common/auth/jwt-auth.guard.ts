import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { COMMON_ERROR_CODES } from '../errors/error-codes';
import { JwtTokenService } from './jwt-token.service';
import { AuthenticatedRequest } from './auth.types';

const DESTROY_GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const payload = this.jwtTokenService.verify(request.headers.authorization);
    const userId = BigInt(payload.sub);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        disabledDays: true,
        destroyRequestedAt: true,
      },
    });

    if (!user) {
      throw this.unauthorized('用户信息异常，请重新登录');
    }
    if (user.status === UserStatus.DESTROYED) {
      throw this.unauthorized('账号已注销');
    }
    if (
      user.status === UserStatus.DESTROY_REQUESTED &&
      user.destroyRequestedAt &&
      Date.now() - user.destroyRequestedAt.getTime() > DESTROY_GRACE_PERIOD_MS
    ) {
      throw this.unauthorized('账号已注销');
    }
    if (user.disabledDays > 0 || user.status === UserStatus.DISABLED) {
      throw this.unauthorized(`账号被限制登录 ${user.disabledDays} 天`);
    }

    request.user = {
      id: user.id,
      role: user.role,
      status: user.status,
    };
    return true;
  }

  private unauthorized(message: string): UnauthorizedException {
    return new UnauthorizedException({
      code: COMMON_ERROR_CODES.UNAUTHORIZED,
      message,
    });
  }
}

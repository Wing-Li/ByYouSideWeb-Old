import { UserRole, UserStatus } from '@prisma/client';
import { Request } from 'express';

export type AuthenticatedUser = {
  id: bigint;
  role: UserRole;
  status: UserStatus;
};

export type JwtPayload = {
  sub: string;
  iat: number;
  exp: number;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

import { Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BusinessException } from '../../common/errors/business-exception';
import {
  AUTH_ERROR_CODES,
  USER_ERROR_CODES,
} from '../../common/errors/error-codes';
import { DestroyRequestDto } from './dto/destroy-request.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { toUserProfileDto } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: bigint): Promise<UserProfileDto> {
    const user = await this.findUserOrThrow(userId);
    return toUserProfileDto(user);
  }

  async updateMe(userId: bigint, dto: UpdateMeDto): Promise<UserProfileDto> {
    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const exists = await this.prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (exists) {
        throw new BusinessException(
          AUTH_ERROR_CODES.EMAIL_EXISTS,
          '邮箱已经存在，邮箱为修改密码必备，请慎重填写！',
        );
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.nickname !== undefined) {
      if (dto.nickname.length > 8) {
        throw new BusinessException(
          USER_ERROR_CODES.INVALID_NICKNAME,
          '昵称为 1-8 个字',
        );
      }
      data.nickname = dto.nickname;
    }
    if (dto.gender !== undefined) {
      data.gender = dto.gender;
    }
    if (dto.avatarUrl !== undefined) {
      data.avatarUrl = dto.avatarUrl;
    }
    if (dto.bio !== undefined) {
      if (dto.bio.length > 200) {
        throw new BusinessException(
          USER_ERROR_CODES.INVALID_BIO,
          '简介不能超过 200 个字',
        );
      }
      data.bio = dto.bio;
    }
    if (dto.birthday !== undefined) {
      data.birthday = new Date(dto.birthday);
    }
    if (dto.email !== undefined) {
      data.email = dto.email.trim().toLowerCase();
    }
    if (dto.uploadIntervalMinutes !== undefined) {
      data.uploadIntervalMinutes = dto.uploadIntervalMinutes;
    }
    if (dto.pushDeviceType !== undefined) {
      data.pushDeviceType = dto.pushDeviceType;
    }
    if (dto.pushAliasType !== undefined) {
      data.pushAliasType = dto.pushAliasType;
    }
    if (dto.pushAlias !== undefined) {
      data.pushAlias = dto.pushAlias;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return toUserProfileDto(user);
  }

  async requestDestroy(
    userId: bigint,
    dto: DestroyRequestDto,
  ): Promise<UserProfileDto> {
    const user = await this.findUserOrThrow(userId);
    if (user.status === UserStatus.DESTROY_REQUESTED) {
      throw new BusinessException(
        AUTH_ERROR_CODES.DESTROY_ALREADY_REQUESTED,
        '已经申请注销，请勿重复申请！',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DESTROY_REQUESTED,
        destroyRequestedAt: new Date(),
        destroyReason: dto.destroyReason,
      },
    });
    return toUserProfileDto(updated);
  }

  async cancelDestroy(userId: bigint): Promise<UserProfileDto> {
    await this.findUserOrThrow(userId);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        destroyRequestedAt: null,
        destroyReason: '',
      },
    });
    return toUserProfileDto(updated);
  }

  private async findUserOrThrow(userId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BusinessException(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        '没有此用户',
      );
    }
    return user;
  }
}

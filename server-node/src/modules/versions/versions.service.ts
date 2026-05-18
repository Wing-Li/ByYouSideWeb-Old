import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BusinessException } from '../../common/errors/business-exception';
import {
  COMMON_ERROR_CODES,
  CONTENT_ERROR_CODES,
} from '../../common/errors/error-codes';
import { AppVersionDto } from './dto/app-version.dto';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { toAppVersionDto } from './versions.mapper';

@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createVersion(
    currentUserRole: UserRole,
    dto: CreateAppVersionDto,
  ): Promise<AppVersionDto> {
    this.assertAdmin(currentUserRole);
    const version = await this.prisma.appVersion.create({
      data: dto,
    });
    return toAppVersionDto(version);
  }

  async getLatestVersion(): Promise<AppVersionDto> {
    const version = await this.prisma.appVersion.findFirst({
      orderBy: { releasedAt: 'desc' },
    });
    if (!version) {
      throw new BusinessException(
        CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
        '目前没有新版本发布',
        HttpStatus.NOT_FOUND,
      );
    }
    return toAppVersionDto(version);
  }

  private assertAdmin(role: UserRole): void {
    if (role !== UserRole.ADMIN) {
      throw new BusinessException(
        COMMON_ERROR_CODES.FORBIDDEN,
        '只有管理员才可以操作',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BusinessException } from '../../common/errors/business-exception';
import {
  APP_CONFIG_ERROR_CODES,
  COMMON_ERROR_CODES,
} from '../../common/errors/error-codes';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';
import { AppConfigDto } from './dto/app-config.dto';
import { toAppConfigDto } from './app-config.mapper';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getAppConfig(): Promise<AppConfigDto> {
    const config = await this.prisma.appConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!config) {
      throw new BusinessException(
        APP_CONFIG_ERROR_CODES.APP_CONFIG_NOT_FOUND,
        'App还没有基本配置，请联系管理员',
        HttpStatus.NOT_FOUND,
      );
    }
    const vipPlans = await this.prisma.vipPlan.findMany({
      orderBy: [{ status: 'asc' }, { durationMonths: 'asc' }, { id: 'asc' }],
    });
    return toAppConfigDto(config, vipPlans);
  }

  async updateAppConfig(
    currentUserRole: UserRole,
    dto: UpdateAppConfigDto,
  ): Promise<AppConfigDto> {
    this.assertAdmin(currentUserRole);
    const environment = this.requireConfig('APP_ENVIRONMENT');
    const config = await this.prisma.appConfig.upsert({
      where: { environment },
      create: {
        environment,
        appName: dto.appName ?? this.requireConfig('APP_NAME'),
        unCheckMode: dto.unCheckMode ?? false,
      },
      update: {
        ...(dto.appName !== undefined ? { appName: dto.appName } : {}),
        ...(dto.unCheckMode !== undefined
          ? { unCheckMode: dto.unCheckMode }
          : {}),
      },
    });
    const vipPlans = await this.prisma.vipPlan.findMany({
      orderBy: [{ status: 'asc' }, { durationMonths: 'asc' }, { id: 'asc' }],
    });
    return toAppConfigDto(config, vipPlans);
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

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new Error(`${key} 未配置`);
    }
    return value;
  }
}

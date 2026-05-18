import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BusinessException } from '../../common/errors/business-exception';
import {
  COMMON_ERROR_CODES,
  CONTENT_ERROR_CODES,
} from '../../common/errors/error-codes';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { AnnouncementDto } from './dto/announcement.dto';
import { AnnouncementQueryDto } from './dto/announcement-query.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { toAnnouncementDto } from './announcements.mapper';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAnnouncement(
    currentUserId: bigint,
    currentUserRole: UserRole,
    dto: CreateAnnouncementDto,
  ): Promise<AnnouncementDto> {
    this.assertAdmin(currentUserRole);
    const announcement = await this.prisma.announcement.create({
      data: {
        authorId: currentUserId,
        title: dto.title,
        authorName: dto.authorName ?? '管理员',
        content: dto.content,
      },
    });
    return toAnnouncementDto(announcement);
  }

  async listAnnouncements(
    query: AnnouncementQueryDto,
  ): Promise<PaginatedApiResponseBody<AnnouncementDto[]>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [total, announcements] = await Promise.all([
      this.prisma.announcement.count(),
      this.prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.ceil(total / pageSize);
    return {
      code: 200,
      message: 'success',
      data: announcements.map(toAnnouncementDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        isLast: page >= totalPages,
      },
    };
  }

  async getLatestAnnouncement(): Promise<AnnouncementDto> {
    const announcement = await this.prisma.announcement.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!announcement) {
      throw new BusinessException(
        CONTENT_ERROR_CODES.CONTENT_NOT_FOUND,
        '请求的内容不存在',
        HttpStatus.NOT_FOUND,
      );
    }
    return toAnnouncementDto(announcement);
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

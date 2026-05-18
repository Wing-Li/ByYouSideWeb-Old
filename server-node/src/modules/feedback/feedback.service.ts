import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BusinessException } from '../../common/errors/business-exception';
import { COMMON_ERROR_CODES } from '../../common/errors/error-codes';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { toFeedbackDto } from './feedback.mapper';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(
    currentUserId: bigint,
    dto: CreateFeedbackDto,
  ): Promise<string> {
    await this.prisma.feedback.create({
      data: {
        userId: currentUserId,
        content: dto.content,
      },
    });
    return '提交成功';
  }

  async listFeedback(
    currentUserRole: UserRole,
    query: FeedbackQueryDto,
  ): Promise<PaginatedApiResponseBody<FeedbackDto[]>> {
    this.assertAdmin(currentUserRole);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [total, feedback] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.ceil(total / pageSize);
    return {
      code: 200,
      message: 'success',
      data: feedback.map(toFeedbackDto),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        isLast: page >= totalPages,
      },
    };
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

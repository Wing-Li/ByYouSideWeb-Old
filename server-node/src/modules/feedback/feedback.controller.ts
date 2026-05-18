import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponseDto,
  PaginatedApiResponseDto,
} from '../../common/response/api-response.dto';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('反馈')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({
    summary: '提交意见反馈',
    description: '旧接口映射：POST /feedback/add。使用当前登录用户提交反馈。',
  })
  @ApiCreatedResponse({
    description: '反馈已提交。',
    type: ApiResponseDto<string>,
  })
  @ApiUnauthorizedResponse({ description: '未登录或登录已过期。' })
  createFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFeedbackDto,
  ): Promise<string> {
    return this.feedbackService.createFeedback(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: '管理员分页查看反馈',
    description:
      '旧接口映射：GET /feedback/get。新系统收敛为仅管理员可查看全部反馈。',
  })
  @ApiOkResponse({
    description: '反馈分页列表。',
    type: PaginatedApiResponseDto<FeedbackDto[]>,
  })
  @ApiForbiddenResponse({ description: '只有管理员才可以操作。' })
  listFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FeedbackQueryDto,
  ): Promise<PaginatedApiResponseBody<FeedbackDto[]>> {
    return this.feedbackService.listFeedback(user.role, query);
  }
}

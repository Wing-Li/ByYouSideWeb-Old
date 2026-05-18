import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponseDto,
  PaginatedApiResponseDto,
} from '../../common/response/api-response.dto';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementDto } from './dto/announcement.dto';
import { AnnouncementQueryDto } from './dto/announcement-query.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@ApiTags('公告')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '创建公告',
    description:
      '旧接口映射：POST /announcement/add。新系统收敛为仅管理员可发布公告。',
  })
  @ApiCreatedResponse({
    description: '公告已创建。',
    type: ApiResponseDto<AnnouncementDto>,
  })
  @ApiForbiddenResponse({ description: '只有管理员才可以操作。' })
  createAnnouncement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnnouncementDto,
  ): Promise<AnnouncementDto> {
    return this.announcementsService.createAnnouncement(
      user.id,
      user.role,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: '分页查询公告',
    description: '旧接口映射：GET /announcement/getAll。',
  })
  @ApiOkResponse({
    description: '公告分页列表。',
    type: PaginatedApiResponseDto<AnnouncementDto[]>,
  })
  listAnnouncements(
    @Query() query: AnnouncementQueryDto,
  ): Promise<PaginatedApiResponseBody<AnnouncementDto[]>> {
    return this.announcementsService.listAnnouncements(query);
  }

  @Get('latest')
  @ApiOperation({
    summary: '查询最新公告',
    description: '旧接口映射：GET /announcement/getLast。',
  })
  @ApiOkResponse({
    description: '最新公告。',
    type: ApiResponseDto<AnnouncementDto>,
  })
  @ApiNotFoundResponse({ description: '请求的内容不存在。' })
  getLatestAnnouncement(): Promise<AnnouncementDto> {
    return this.announcementsService.getLatestAnnouncement();
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
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
import { CreateMemoirDto } from './dto/create-memoir.dto';
import { MemoirDto } from './dto/memoir.dto';
import { MemoirQueryDto } from './dto/memoir-query.dto';
import { UpdateMemoirDto } from './dto/update-memoir.dto';
import { MemoirsService } from './memoirs.service';

@ApiTags('回忆录')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('memoirs')
export class MemoirsController {
  constructor(private readonly memoirsService: MemoirsService) {}

  @Post()
  @ApiOperation({
    summary: '创建回忆录',
    description:
      '旧接口映射：POST /api/memoirs/create。只能在当前用户拥有的已接受好友关系中创建。',
  })
  @ApiCreatedResponse({
    description: '回忆录已创建。',
    type: ApiResponseDto<MemoirDto>,
  })
  @ApiBadRequestResponse({ description: '请求字段格式不正确。' })
  @ApiUnauthorizedResponse({ description: '未登录或登录已过期。' })
  @ApiForbiddenResponse({ description: '好友关系异常。' })
  createMemoir(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMemoirDto,
  ): Promise<MemoirDto> {
    return this.memoirsService.createMemoir(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: '查询好友关系下的回忆录列表',
    description:
      '旧接口映射：GET /api/memoirs/list。会返回双方在双向好友关系下发布的回忆录，按发生时间倒序分页。',
  })
  @ApiOkResponse({
    description: '回忆录分页列表。',
    type: PaginatedApiResponseDto<MemoirDto[]>,
  })
  @ApiForbiddenResponse({ description: '好友关系异常。' })
  listMemoirs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MemoirQueryDto,
  ): Promise<PaginatedApiResponseBody<MemoirDto[]>> {
    return this.memoirsService.listMemoirs(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '查询回忆录详情',
    description:
      '旧接口映射：GET /api/memoirs/get。新后端要求当前用户属于该回忆所在的已接受好友关系。',
  })
  @ApiOkResponse({
    description: '回忆录详情。',
    type: ApiResponseDto<MemoirDto>,
  })
  @ApiForbiddenResponse({ description: '只能查看好友关系内的回忆。' })
  @ApiNotFoundResponse({ description: '回忆录不存在。' })
  getMemoir(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MemoirDto> {
    return this.memoirsService.getMemoir(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '更新回忆录',
    description:
      '旧接口映射：POST /api/memoirs/update。新后端只允许作者本人更新。',
  })
  @ApiOkResponse({
    description: '回忆录已更新。',
    type: ApiResponseDto<MemoirDto>,
  })
  @ApiForbiddenResponse({ description: '此回忆不是您写的，无法修改。' })
  @ApiNotFoundResponse({ description: '回忆录不存在。' })
  updateMemoir(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemoirDto,
  ): Promise<MemoirDto> {
    return this.memoirsService.updateMemoir(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除回忆录',
    description: '旧接口映射：POST /api/memoirs/delete。只允许作者本人删除。',
  })
  @ApiOkResponse({
    description: '回忆录已删除。',
    type: ApiResponseDto<string>,
  })
  @ApiForbiddenResponse({ description: '此回忆不是您写的，无法删除。' })
  @ApiNotFoundResponse({ description: '回忆录不存在。' })
  deleteMemoir(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<string> {
    return this.memoirsService.deleteMemoir(user.id, id);
  }
}

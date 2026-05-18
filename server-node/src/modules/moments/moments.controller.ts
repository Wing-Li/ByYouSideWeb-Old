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
import { CreateMomentDto } from './dto/create-moment.dto';
import { MomentDto } from './dto/moment.dto';
import { MomentQueryDto } from './dto/moment-query.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { MomentsService } from './moments.service';

@ApiTags('瞬间')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('moments')
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Post()
  @ApiOperation({
    summary: '创建瞬间',
    description:
      '旧接口映射：POST /api/moments/create。只能在当前用户拥有的已接受好友关系中创建。',
  })
  @ApiCreatedResponse({
    description: '瞬间已创建。',
    type: ApiResponseDto<MomentDto>,
  })
  @ApiBadRequestResponse({ description: '请求字段格式不正确。' })
  @ApiUnauthorizedResponse({ description: '未登录或登录已过期。' })
  @ApiForbiddenResponse({ description: '好友关系异常。' })
  createMoment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMomentDto,
  ): Promise<MomentDto> {
    return this.momentsService.createMoment(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: '查询好友关系下的瞬间列表',
    description:
      '旧接口映射：GET /api/moments/list。会返回双方在双向好友关系下发布的瞬间，按发生时间倒序分页。',
  })
  @ApiOkResponse({
    description: '瞬间分页列表。',
    type: PaginatedApiResponseDto<MomentDto[]>,
  })
  @ApiForbiddenResponse({ description: '好友关系异常。' })
  listMoments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MomentQueryDto,
  ): Promise<PaginatedApiResponseBody<MomentDto[]>> {
    return this.momentsService.listMoments(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '查询瞬间详情',
    description:
      '旧接口映射：GET /api/moments/get。新后端要求当前用户属于该瞬间所在的已接受好友关系。',
  })
  @ApiOkResponse({ description: '瞬间详情。', type: ApiResponseDto<MomentDto> })
  @ApiForbiddenResponse({ description: '只能查看好友关系内的瞬间。' })
  @ApiNotFoundResponse({ description: '瞬间不存在。' })
  getMoment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MomentDto> {
    return this.momentsService.getMoment(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '更新瞬间',
    description:
      '旧接口映射：POST /api/moments/update。新后端只允许作者本人更新。',
  })
  @ApiOkResponse({
    description: '瞬间已更新。',
    type: ApiResponseDto<MomentDto>,
  })
  @ApiForbiddenResponse({ description: '此瞬间不是您写的，无法修改。' })
  @ApiNotFoundResponse({ description: '瞬间不存在。' })
  updateMoment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMomentDto,
  ): Promise<MomentDto> {
    return this.momentsService.updateMoment(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除瞬间',
    description: '旧接口映射：POST /api/moments/delete。只允许作者本人删除。',
  })
  @ApiOkResponse({ description: '瞬间已删除。', type: ApiResponseDto<string> })
  @ApiForbiddenResponse({ description: '此瞬间不是您写的，无法删除。' })
  @ApiNotFoundResponse({ description: '瞬间不存在。' })
  deleteMoment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<string> {
    return this.momentsService.deleteMoment(user.id, id);
  }
}

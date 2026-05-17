import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/response/api-response.dto';
import { DestroyRequestDto } from './dto/destroy-request.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('用户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '旧接口映射：POST /api/user/getMyInfo。',
  })
  @ApiOkResponse({
    description: '当前用户信息。',
    type: ApiResponseDto<UserProfileDto>,
  })
  @ApiUnauthorizedResponse({ description: '未登录或登录已过期。' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: '更新当前用户资料',
    description:
      '旧接口映射：POST /api/user/update。新系统不再同步网易云信 IM。',
  })
  @ApiOkResponse({
    description: '更新后的用户信息。',
    type: ApiResponseDto<UserProfileDto>,
  })
  @ApiBadRequestResponse({ description: '昵称、简介、邮箱等参数不合法。' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateMe(user.id, dto);
  }

  @Post('me/destroy-request')
  @ApiOperation({
    summary: '申请注销当前账号',
    description: '旧接口映射：POST /api/user/destroy。',
  })
  @ApiOkResponse({
    description: '已提交注销申请。',
    type: ApiResponseDto<UserProfileDto>,
  })
  requestDestroy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DestroyRequestDto,
  ): Promise<UserProfileDto> {
    return this.usersService.requestDestroy(user.id, dto);
  }

  @Post('me/destroy-request/cancel')
  @ApiOperation({
    summary: '取消当前账号注销申请',
    description:
      '旧接口映射：POST /api/user/cancelDestroy。新接口改为当前登录用户自助取消，不再允许免登录传任意 userId。',
  })
  @ApiOkResponse({
    description: '已取消注销申请。',
    type: ApiResponseDto<UserProfileDto>,
  })
  cancelDestroy(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileDto> {
    return this.usersService.cancelDestroy(user.id);
  }
}

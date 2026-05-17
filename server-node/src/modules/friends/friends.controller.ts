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
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponseDto,
  PaginatedApiResponseDto,
} from '../../common/response/api-response.dto';
import { PaginatedApiResponseBody } from '../../common/response/api-response.types';
import { FriendRelationDto } from './dto/friend-relation.dto';
import { FriendStatusQueryDto } from './dto/friend-status-query.dto';
import { RejectFriendRequestDto } from './dto/reject-friend-request.dto';
import { RequestFriendDto } from './dto/request-friend.dto';
import { UpdateFriendAliasDto } from './dto/update-friend-alias.dto';
import { UpdateFriendBlockDto } from './dto/update-friend-block.dto';
import { FriendsService } from './friends.service';

@ApiTags('好友')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('requests')
  @ApiOperation({
    summary: '请求添加好友',
    description:
      '旧接口映射：POST /api/friend/request。若对方已经请求当前用户，会直接建立双方好友关系。',
  })
  @ApiCreatedResponse({
    description: '好友请求已创建，或双方已直接成为好友。',
    type: ApiResponseDto<FriendRelationDto>,
  })
  @ApiBadRequestResponse({
    description: '重复请求、已是好友、对方永久拒绝或用户状态异常。',
  })
  @ApiUnauthorizedResponse({ description: '未登录或登录已过期。' })
  requestFriend(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestFriendDto,
  ): Promise<FriendRelationDto> {
    return this.friendsService.requestFriend(user.id, dto);
  }

  @Post('requests/:id/accept')
  @ApiOperation({
    summary: '同意好友请求',
    description:
      '旧接口映射：POST /api/friend/agreeRequest。会把对方请求改为已同意，并为当前用户创建反向好友记录。',
  })
  @ApiCreatedResponse({
    description: '已同意好友请求。',
    type: ApiResponseDto<FriendRelationDto>,
  })
  @ApiForbiddenResponse({ description: '不能操作不属于自己的请求。' })
  @ApiNotFoundResponse({ description: '好友关系不存在。' })
  acceptFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<FriendRelationDto> {
    return this.friendsService.acceptFriendRequest(user.id, id);
  }

  @Post('requests/:id/reject')
  @ApiOperation({
    summary: '拒绝好友请求',
    description:
      '旧接口映射：POST /api/friend/rejectRequest。可选择普通拒绝或永久拒绝。',
  })
  @ApiCreatedResponse({
    description: '已拒绝好友请求。',
    type: ApiResponseDto<FriendRelationDto>,
  })
  @ApiForbiddenResponse({ description: '不能操作不属于自己的请求。' })
  @ApiNotFoundResponse({ description: '好友关系不存在。' })
  rejectFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectFriendRequestDto,
  ): Promise<FriendRelationDto> {
    return this.friendsService.rejectFriendRequest(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除好友',
    description:
      '旧接口映射：POST /api/friend/delete。删除双方关系记录，并清理双方关系 ID 下的回忆录和瞬间。',
  })
  @ApiOkResponse({
    description: '好友已删除。',
    type: ApiResponseDto<string>,
  })
  @ApiForbiddenResponse({ description: '不能删除不属于自己的关系。' })
  @ApiNotFoundResponse({ description: '好友关系不存在。' })
  deleteFriend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<string> {
    return this.friendsService.deleteFriend(user.id, id);
  }

  @Patch(':id/block')
  @ApiOperation({
    summary: '拉黑或取消拉黑好友',
    description:
      '旧接口映射：POST /api/friend/block。会同步更新双方关系记录中的拉黑状态。',
  })
  @ApiOkResponse({
    description: '拉黑状态已更新。',
    type: ApiResponseDto<string>,
  })
  updateBlockState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFriendBlockDto,
  ): Promise<string> {
    return this.friendsService.updateBlockState(user.id, id, dto);
  }

  @Patch(':id/alias')
  @ApiOperation({
    summary: '修改好友备注',
    description:
      '旧接口映射：POST /api/friend/update。备注不能为空且最多 8 个字符。',
  })
  @ApiOkResponse({
    description: '好友备注已更新。',
    type: ApiResponseDto<string>,
  })
  updateAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFriendAliasDto,
  ): Promise<string> {
    return this.friendsService.updateAlias(user.id, id, dto);
  }

  @Get()
  @ApiOperation({
    summary: '查询我的好友',
    description:
      '旧接口映射：POST /api/friend/getMyFriend。不传 status 时默认只查询已同意好友。',
  })
  @ApiOkResponse({
    description: '我的好友列表。',
    type: PaginatedApiResponseDto<FriendRelationDto[]>,
  })
  getMyFriends(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FriendStatusQueryDto,
  ): Promise<PaginatedApiResponseBody<FriendRelationDto[]>> {
    return this.friendsService.getMyFriends(user.id, query);
  }

  @Get('requests/incoming')
  @ApiOperation({
    summary: '查询请求我的好友',
    description:
      '旧接口映射：POST /api/friend/getRequestMeFriend。不传 status 时默认查询等待和已拒绝的请求。',
  })
  @ApiOkResponse({
    description: '请求我的好友列表。',
    type: PaginatedApiResponseDto<FriendRelationDto[]>,
  })
  getIncomingRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FriendStatusQueryDto,
  ): Promise<PaginatedApiResponseBody<FriendRelationDto[]>> {
    return this.friendsService.getIncomingRequests(user.id, query);
  }

  @Post(':id/best')
  @ApiOperation({
    summary: '绑定亲密好友',
    description:
      '旧接口映射：POST /api/friend/bindBestFriend。当前用户只能有一个亲密好友。',
  })
  @ApiCreatedResponse({
    description: '亲密好友已绑定。',
    type: ApiResponseDto<FriendRelationDto>,
  })
  bindBestFriend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<FriendRelationDto> {
    return this.friendsService.bindBestFriend(user.id, id);
  }
}

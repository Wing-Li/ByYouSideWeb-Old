import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/response/api-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetCodeDto } from './dto/password-reset-code.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: '注册账号',
    description:
      '旧接口映射：POST /api/user/register。注册成功后返回标准 JWT 和用户资料。',
  })
  @ApiCreatedResponse({
    description: '注册成功。',
    type: ApiResponseDto<AuthResponseDto>,
  })
  @ApiBadRequestResponse({
    description: '用户名、密码、邮箱校验失败，或用户名/邮箱已存在。',
  })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: '登录',
    description:
      '旧接口映射：POST /api/user/login。用户名字段支持填写用户名或邮箱。',
  })
  @ApiOkResponse({
    description: '登录成功。',
    type: ApiResponseDto<AuthResponseDto>,
  })
  @ApiBadRequestResponse({
    description: '用户不存在、密码错误或账号状态不可登录。',
  })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('password-reset/code')
  @ApiOperation({
    summary: '发送密码重置验证码',
    description:
      '旧接口映射：POST /api/user/resetPassSendEmailCode。验证码只保存 hash，开发环境使用 mock/log 邮件 provider。',
  })
  @ApiOkResponse({
    description: '验证码已发送。',
    type: ApiResponseDto<string>,
  })
  sendPasswordResetCode(@Body() dto: PasswordResetCodeDto): Promise<string> {
    return this.authService.sendPasswordResetCode(dto);
  }

  @Post('password-reset/confirm')
  @ApiOperation({
    summary: '确认密码重置',
    description:
      '旧接口映射：POST /api/user/resetPassVerifyCode。验证码 5 分钟内有效，成功后会消费验证码。',
  })
  @ApiOkResponse({
    description: '密码修改成功。',
    type: ApiResponseDto<string>,
  })
  confirmPasswordReset(@Body() dto: PasswordResetConfirmDto): Promise<string> {
    return this.authService.confirmPasswordReset(dto);
  }
}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MailModule } from '../../integrations/mail/mail.module';
import { JwtTokenService } from '../../common/auth/jwt-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtTokenService],
  exports: [JwtTokenService],
})
export class AuthModule {}

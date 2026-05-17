import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtTokenService } from '../../common/auth/jwt-token.service';
import { DatabaseModule } from '../../database/database.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard, JwtTokenService],
  exports: [UsersService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { PushModule } from '../../integrations/push/push.module';
import { AuthModule } from '../auth/auth.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  imports: [AuthModule, PushModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}

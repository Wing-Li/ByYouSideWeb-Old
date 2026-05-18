import { Module } from '@nestjs/common';
import { PushModule } from '../../integrations/push/push.module';
import { AuthModule } from '../auth/auth.module';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';

@Module({
  imports: [AuthModule, PushModule],
  controllers: [VipController],
  providers: [VipService],
})
export class VipModule {}

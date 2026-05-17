import { Module } from '@nestjs/common';
import { PushModule } from '../../integrations/push/push.module';
import { AuthModule } from '../auth/auth.module';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [AuthModule, PushModule],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}

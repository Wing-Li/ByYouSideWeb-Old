import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemoirsController } from './memoirs.controller';
import { MemoirsService } from './memoirs.service';

@Module({
  imports: [AuthModule],
  controllers: [MemoirsController],
  providers: [MemoirsService],
})
export class MemoirsModule {}

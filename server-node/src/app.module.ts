import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AppConfigModule } from './modules/app-config/app-config.module';
import { AuthModule } from './modules/auth/auth.module';
import { DevicesModule } from './modules/devices/devices.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { FriendsModule } from './modules/friends/friends.module';
import { HealthModule } from './modules/health/health.module';
import { MemoirsModule } from './modules/memoirs/memoirs.module';
import { MomentsModule } from './modules/moments/moments.module';
import { UsersModule } from './modules/users/users.module';
import { VersionsModule } from './modules/versions/versions.module';
import { VipModule } from './modules/vip/vip.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    AnnouncementsModule,
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    DevicesModule,
    FeedbackModule,
    FriendsModule,
    HealthModule,
    MemoirsModule,
    MomentsModule,
    UsersModule,
    VersionsModule,
    VipModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DevicesModule } from './modules/devices/devices.module';
import { FriendsModule } from './modules/friends/friends.module';
import { HealthModule } from './modules/health/health.module';
import { MemoirsModule } from './modules/memoirs/memoirs.module';
import { MomentsModule } from './modules/moments/moments.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    DatabaseModule,
    AuthModule,
    DevicesModule,
    FriendsModule,
    HealthModule,
    MemoirsModule,
    MomentsModule,
    UsersModule,
  ],
})
export class AppModule {}

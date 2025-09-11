import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RedisModule } from './redis/redis.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AddressesModule } from './addresses/addresses.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/buzoku', {
      autoCreate: true,
      dbName: process.env.MONGO_DB || 'buzoku',
    }),
    RedisModule,
    HealthModule,
    UsersModule,
    ProfilesModule,
    AddressesModule,
    AuthModule,
    NotificationsModule,
  ],
})
export class AppModule {}

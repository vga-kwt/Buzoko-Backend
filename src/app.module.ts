import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/buzoku', {
      autoCreate: true,
      dbName: process.env.MONGO_DB || 'buzoku',
    }),
    HealthModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  controllers: [HealthController],
})
export class HealthModule {}

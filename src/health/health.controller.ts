import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmsService } from '../sms/sms.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly smsService: SmsService) {}

  @Get()
  get() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Example: GET /health/send-sms?to=96550485511&message=Hello
   * - `to` is required
   * - `message` defaults to a simple test message
   */
  @Get('send-sms')
  @ApiOperation({ summary: 'Send test SMS (query params: to, message)' })
  async sendSms(
    @Query('to') to: string,
    @Query('message') message = 'Test SMS from Health endpoint'
  ) {
    if (!to) {
      return { success: false, error: 'Query param "to" is required (e.g. ?to=96550485511)' };
    }

    // Call SmsService (returns { success: boolean, data?, error? } in the examples earlier)
    const result = await this.smsService.sendSms(to, message);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send SMS' };
    }

    // Return parsed gateway response for debugging — trim this in production
    return { success: true, data: result.data };
  }
}

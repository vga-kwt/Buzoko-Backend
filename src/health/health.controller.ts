import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery, ApiBadRequestResponse } from '@nestjs/swagger';
import { SmsService } from '../sms/sms.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly smsService: SmsService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Service status', schema: { properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string', format: 'date-time' } } } })
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
  @ApiQuery({ name: 'to', required: true, description: 'Destination phone number' })
  @ApiQuery({ name: 'message', required: false, description: 'Message to send', example: 'Hello' })
  @ApiOkResponse({ description: 'Result of sending test SMS', schema: { oneOf: [ { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object' } } }, { type: 'object', properties: { success: { type: 'boolean', example: false }, error: { type: 'string' } } } ] } })
  @ApiBadRequestResponse({ description: 'Missing required query param "to"' })
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

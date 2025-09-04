import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly baseUrl = process.env.SMS_BASE_URL;
  private readonly username = process.env.SMS_USERNAME;
  private readonly password = process.env.SMS_PASSWORD;
  private readonly customerId = process.env.SMS_CUSTOMERID;
  // private readonly senderText = process.env.SMS_SENDER;

  constructor() {
    if (!this.baseUrl || !this.username || !this.password || !this.customerId) {
      this.logger.warn('SMS environment variables are not fully set.');
    }
  }

  private sanitizeBaseUrl(raw = process.env.SMS_BASE_URL || '') {
    return raw.replace(/\?+$/, '');
  }

  async sendSms(numbers: string | string[], message: string) {
    // Ensure base URL uses http and has no trailing question marks, and match PHP path casing
    let base = this.sanitizeBaseUrl(
      process.env.SMS_BASE_URL ||
        'http://smsbox.com/SMSGateway/Services/Messaging.asmx/Http_SendSMS'
    );
    if (base.startsWith('https://smsbox.com')) {
      base = 'http://' + base.substring('https://'.length);
    }

    const recipient = Array.isArray(numbers) ? numbers.join(',') : numbers;

    // Follow the PHP example: encode username, password, and messageBody; leave others raw
    const username = encodeURIComponent(process.env.SMS_USERNAME || 'valueandgrowth');
    const password = encodeURIComponent(process.env.SMS_PASSWORD || 'VGA112233@');
    const messageBody = encodeURIComponent(message);

    // camelCase parameter names as in PHP
    const parts: string[] = [
      `username=${username}`,
      `password=${password}`,
      `customerId=${process.env.SMS_CUSTOMERID || '3441'}`,
      `senderText=${process.env.SMS_SENDER || 'V G A'}`,
      `defDate=`,
      `isBlink=false`,
      `isFlash=false`,
      `recipientNumbers=${recipient}`,
      `messageBody=${messageBody}`,
    ];

    const url = `${base}?${parts.join('&')}`;

    // Log URL without exposing password
    const safeUrl = url.replace(/(password=)[^&]*/i, '$1******');
    this.logger.debug(`SMS request URL: ${safeUrl}`);

    // Space-safety for Node HTTP client
    const requestUrl = url.replace(/ /g, '%20');

    try {
      const resp = await axios.get(requestUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'MyApp/1.0', Accept: 'text/xml,application/xml,*/*;q=0.1' },
      });
      const raw = resp.data;
      if (typeof raw === 'string' && raw.trim().startsWith('<')) {
        const parsed = await parseStringPromise(raw, { explicitArray: false });
        return { success: true, data: parsed };
      }
      return { success: true, data: raw };
    } catch (err: any) {
      if (err.response) {
        this.logger.warn('SMS gateway returned non-2xx', {
          status: err.response.status,
          headers: err.response.headers,
          body:
            typeof err.response.data === 'string'
              ? err.response.data.substring(0, 2000)
              : err.response.data,
        });
        return { success: false, status: err.response.status, body: err.response.data };
      }
      this.logger.error('SMS send error', err.message || err);
      return { success: false, error: err.message || 'Unknown' };
    }
  }

  async getSmsStatus(messageId: string) {
    // Build status URL similarly to PHP logic
    let base = this.sanitizeBaseUrl(
      process.env.SMS_STATUS_URL ||
        'http://smsbox.com/SMSGateway/Services/Messaging.asmx/Http_GetSmsStatus'
    );
    if (base.startsWith('https://smsbox.com')) {
      base = 'http://' + base.substring('https://'.length);
    }

    const username = encodeURIComponent(process.env.SMS_USERNAME || 'valueandgrowth');
    const password = encodeURIComponent(process.env.SMS_PASSWORD || 'VGA112233@');

    const parts: string[] = [
      `username=${username}`,
      `password=${password}`,
      `customerId=${process.env.SMS_CUSTOMERID || '3441'}`,
      `messageId=${messageId}`,
      `detailed=true`,
    ];

    const url = `${base}?${parts.join('&')}`;
    const safeUrl = url.replace(/(password=)[^&]*/i, '$1******');
    this.logger.debug(`SMS status URL: ${safeUrl}`);

    const requestUrl = url.replace(/ /g, '%20');

    try {
      const resp = await axios.get(requestUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'MyApp/1.0', Accept: 'text/xml,application/xml,*/*;q=0.1' },
      });
      const raw = resp.data;
      let parsed: any = raw;
      if (typeof raw === 'string' && raw.trim().startsWith('<')) {
        parsed = await parseStringPromise(raw, { explicitArray: false });
      }

      // Try to compute a delivered flag similar to the PHP example
      let delivered: boolean | undefined;
      try {
        const counters =
          parsed?.SmsStatusResponse?.Counters ||
          parsed?.Counters ||
          parsed?.smsstatusresponse?.counters;
        if (counters && typeof counters.SentCount !== 'undefined') {
          delivered = String(counters.SentCount) === '1';
        }
      } catch (_) {}

      return { success: true, data: parsed, delivered };
    } catch (err: any) {
      if (err.response) {
        this.logger.warn('SMS gateway status non-2xx', {
          status: err.response.status,
          headers: err.response.headers,
          body:
            typeof err.response.data === 'string'
              ? err.response.data.substring(0, 2000)
              : err.response.data,
        });
        return { success: false, status: err.response.status, body: err.response.data };
      }
      this.logger.error('SMS status error', err.message || err);
      return { success: false, error: err.message || 'Unknown' };
    }
  }
}

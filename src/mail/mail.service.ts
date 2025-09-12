import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;

  constructor() {
    const user = process.env.MAIL_USER;
    const pass = (process.env.MAIL_PASS || '').replace(/^"|"$/g, ''); // strip quotes if any
    this.defaultFrom = process.env.MAIL_FROM || user || '';

    if (!user || !pass) {
      this.logger.warn('MAIL_USER or MAIL_PASS not set. Mail sending will fail until configured.');
    }

    // Gmail SMTP via App Password
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  async sendMail(opts: SendMailOptions) {
    if (!opts.text && !opts.html) {
      throw new InternalServerErrorException('Either text or html content must be provided');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: opts.from || this.defaultFrom,
      to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
    } catch (error: any) {
      this.logger.error('Failed to send email', error?.stack || error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}

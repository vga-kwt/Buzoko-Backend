import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 201, description: 'Email sent successfully' })
  async send(@Body() dto: SendMailDto) {
    if (!dto.text && !dto.html) {
      throw new HttpException('Either text or html must be provided', HttpStatus.BAD_REQUEST);
    }

    const result = await this.mailService.sendMail({
      to: dto.to,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
      from: dto.from,
    });

    return { message: 'Email sent', ...result };
  }
}

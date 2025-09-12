import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMailDto {
  @ApiProperty({
    description: 'Recipient email(s). Accepts a single email string or an array of emails.',
    oneOf: [
      { type: 'string', format: 'email' },
      { type: 'array', items: { type: 'string', format: 'email' } },
    ],
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value;
    return value;
  })
  @IsArray()
  @IsEmail({}, { each: true })
  to!: string[];

  @ApiProperty({ description: 'Subject of the email' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiPropertyOptional({ description: 'Plain text content' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML content' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({ description: 'From email address; defaults to MAIL_FROM or MAIL_USER' })
  @IsOptional()
  @IsString()
  from?: string;
}

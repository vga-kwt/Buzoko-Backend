import { IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+15551234567' })
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be in E.164 format' })
  phoneE164!: string;

  @ApiProperty({ example: '123456', description: 'OTP code (numeric, typically 6 digits)' })
  @IsNotEmpty()
  @Matches(/^\d{4,8}$/, { message: 'code must be numeric (typically 4-6 digits)' })
  code!: string;
}

import { IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+15551234567' })
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be in E.164 format' })
  phoneE164!: string;

  @ApiProperty({ example: '1234', description: 'OTP code (numeric, 4 digits)' })
  @IsNotEmpty()
  @Matches(/^\d{4}$/i, { message: 'code must be a 4-digit number' })
  code!: string;
}

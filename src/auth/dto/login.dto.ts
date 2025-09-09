import { IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+15551234567', description: 'Phone number in E.164 format' })
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be in E.164 format (eg. +15551234567)' })
  phoneE164!: string;

  @ApiProperty({ example: 'Password', description: 'Password must be at least 8 characters' })
  @IsNotEmpty()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password!: string;
}

import { IsNotEmpty, Matches, MinLength, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '+15551234567', description: 'Phone number in E.164 format' })
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be in E.164 format (eg. +15551234567)' })
  phoneE164!: string;

  @ApiProperty({ required: false, example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiProperty({ example: 'Password', description: 'Password must be at least 8 characters' })
  @IsNotEmpty()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password!: string;
}

import { IsString, IsNotEmpty, Matches, IsOptional, IsEmail, IsEnum, IsArray, ArrayNotEmpty, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, RegistrationType } from '../schemas/user.enums';

export class CreateUserDto {
  @ApiProperty({ example: '+15551234567', description: 'Phone number in E.164 format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be in E.164 format (e.g. +15551234567)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phoneE164!: string;

  @ApiProperty({ required: false, example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiProperty({ required: false, enum: UserRole, isArray: true, example: [UserRole.CLIENT] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiProperty({ required: false, enum: RegistrationType, example: RegistrationType.PHONE })
  @IsOptional()
  @IsEnum(RegistrationType)
  registrationType?: RegistrationType;

  @ApiProperty({ required: false, type: Object, additionalProperties: { type: 'string' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
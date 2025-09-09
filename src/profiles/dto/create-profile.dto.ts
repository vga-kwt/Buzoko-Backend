import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../schemas/profile.enums';

export class CreateProfileDto {
  @ApiProperty({
    description: 'User id (MongoDB ObjectId) for which to create the profile',
    example: '64f9a2c2b6e0b8f3a1a2b3c4',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ required: false, maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName?: string;

  @ApiProperty({ required: false, description: 'Avatar image URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    required: false,
    description: 'Date of birth (ISO string)',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false, maxLength: 10, example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}

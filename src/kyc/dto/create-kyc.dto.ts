import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString, MaxLength, IsEnum, IsUrl, ValidateIf, ArrayNotEmpty, ArrayMinSize, ArrayMaxSize, IsOptional, Matches } from 'class-validator';
import { KycStatus } from '../schemas/kyc.schema';

export class CreateKycDto {
  @ApiProperty({ description: 'KYC title', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({ description: 'KYC comments', maxLength: 500, required: false })
  @IsString()
  @MaxLength(500)
  comments?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  // @Matches(/^https:\/\/.*\.s3\.amazonaws\.com\//, { each: true, message: 'Each URL must be a valid S3 link' })
  urls?: string[];
}

export class UpdateKycDto {
  @ApiProperty({ maxLength: 100, required: false })
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  // @Matches(/^https:\/\/.*\.s3\.amazonaws\.com\//, { each: true, message: 'Each URL must be a valid S3 link' })
  urls?: string[];

  @ApiProperty({ required: false })
  @IsString()
  comments?: string;
}








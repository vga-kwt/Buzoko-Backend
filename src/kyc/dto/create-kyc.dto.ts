import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateKycDto {
  @ApiProperty({ description: 'User id (ObjectId)' })
  @IsMongoId()
  userId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  urls!: string[];
}








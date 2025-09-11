import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  questionEn!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  answerEn!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  questionAr!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  answerAr!: string;
}



import { PartialType } from '@nestjs/mapped-types';
import { CreateFaqDto } from './create-faq.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFaqDto extends PartialType(CreateFaqDto) {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  questionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  answerEn?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  questionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  answerAr?: string;
}



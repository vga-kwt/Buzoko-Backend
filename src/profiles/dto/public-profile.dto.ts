import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Gender } from '../schemas/profile.enums';


export class PublicProfileDto {
  @ApiProperty()
  @Expose()
  id!: string;


  @ApiProperty({ required: false })
  @Expose()
  fullName?: string;


  @ApiProperty({ required: false })
  @Expose()
  avatarUrl?: string;


  @ApiProperty({ required: false })
  @Expose()
  dob?: Date;


  @ApiProperty({ enum: Gender, required: false })
  @Expose()
  gender?: Gender;


  @ApiProperty({ required: false })
  @Expose()
  locale?: string;
}
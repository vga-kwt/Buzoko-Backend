import { ApiProperty } from '@nestjs/swagger';

export class PublicVendorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ default: 0 })
  rating!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole, UserStatus } from '../schemas/user.enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  phoneE164?: string;

  @ApiProperty({ required: false })
  @Expose()
  email?: string;

  @ApiProperty({ enum: UserRole, isArray: true })
  @Expose()
  roles!: UserRole[];

  @ApiProperty({ enum: UserStatus })
  @Expose()
  status!: UserStatus;

  @ApiProperty({ required: false })
  @Expose()
  lastLoginAt?: Date;

  @ApiProperty({ required: false })
  @Expose()
  registrationType?: string;

  @ApiProperty({ required: false })
  @Expose()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ type: () => [Object] })
  @Expose()
  addresses?: any[];
}

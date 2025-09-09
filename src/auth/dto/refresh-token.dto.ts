import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOi...<refreshToken>' })
  @IsNotEmpty()
  refreshToken!: string;
}

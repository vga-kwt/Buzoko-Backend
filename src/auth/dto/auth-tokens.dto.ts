import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken!: string;

  @ApiProperty({ description: 'Access token expiry in seconds', required: false, example: 900 })
  expiresIn?: number; // seconds for access token expiry
}

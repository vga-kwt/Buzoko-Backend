import { IsNotEmpty, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  // Backward compatibility: accept legacy field `password` as the new password if provided
  @ApiProperty({
    example: 'NewPassword123',
    required: false,
    description: 'Deprecated: use newPassword instead. If provided, treated as the new password.',
  })
  @ValidateIf((o) => !o.newPassword)
  @IsNotEmpty()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password?: string;
}

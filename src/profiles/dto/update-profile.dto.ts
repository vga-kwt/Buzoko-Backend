import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

// For strict one-to-one relation, prevent updating userId via update DTO
export class UpdateProfileDto extends PartialType(
  OmitType(CreateProfileDto, ['userId'] as const),
) {}

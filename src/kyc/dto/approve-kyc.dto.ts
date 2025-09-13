import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { KycStatus } from '../schemas/kyc.schema';

export class ApproveKycDto {
  @ApiProperty({ enum: KycStatus, description: 'New status (approved/rejected)' })
  @IsEnum(KycStatus)
  status!: KycStatus;
}








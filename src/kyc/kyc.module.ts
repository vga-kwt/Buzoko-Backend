import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { Kyc, KycSchema } from './schemas/kyc.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Kyc.name, schema: KycSchema }])],
  controllers: [KycController],
  providers: [KycService],
})
export class KycModule {}








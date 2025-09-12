import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kyc, KycDocument, KycStatus } from './schemas/kyc.schema';
import { CreateKycDto } from './dto/create-kyc.dto';

@Injectable()
export class KycService {
  constructor(@InjectModel(Kyc.name) private readonly kycModel: Model<KycDocument>) {}

  async create(dto: CreateKycDto) {
    const userId = new Types.ObjectId(dto.userId);
    const created = await this.kycModel.create({ userId, label: dto.label, urls: dto.urls });
    return created.toJSON();
  }

  async approve(id: string, status: KycStatus) {
    const updated = await this.kycModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('KYC record not found');
    return updated.toJSON();
  }

  async listSummaries() {
    return this.kycModel
      .find({}, { label: 1, status: 1, userId: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
      .exec();
  }
}







import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kyc, KycDocument, KycStatus } from './schemas/kyc.schema';
import { CreateKycDto } from './dto/create-kyc.dto';

@Injectable()
export class KycService {
  constructor(@InjectModel(Kyc.name) private readonly kycModel: Model<KycDocument>) {}

  async create(dto: CreateKycDto, userId: string) {
    const created = await this.kycModel.create({
      userId,
      title: dto.title,
      comments: dto.comments,
      urls: dto.urls || [],
      status: dto.status || KycStatus.PENDING,
    });
    return created.toJSON();
  }

  async approve(id: string, status: KycStatus) {
    const updated = await this.kycModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('KYC record not found');
    return updated.toJSON();
  }

  async updateKyc(id: string, dto: { title?: string; comments?: string; urls?: string[] }, userId: string) {
    const updateFields = dto;
    const updated = await this.kycModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateFields },
      { new: true }
    ).exec();
    if (!updated) throw new NotFoundException('KYC record not found or not owned by user');
    return updated.toJSON();
  }

  async listSummaries() {
    return this.kycModel
      .find({}, { label: 1, status: 1, userId: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
      .exec();
  }

  async listKyc(userId: string) {
    return this.kycModel.find({ userId }).sort({ createdAt: -1 }).lean({ virtuals: true }).exec();
  }

  async deleteKyc(id: string, userId: string) {
    const deleted = await this.kycModel.findOneAndDelete({ _id: id, userId }).exec();
    if (!deleted) throw new NotFoundException('KYC record not found or not owned by user');
    return { success: true };
  }
}







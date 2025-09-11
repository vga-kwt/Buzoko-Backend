import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq, FaqDocument } from './schemas/faq.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  constructor(@InjectModel(Faq.name) private readonly faqModel: Model<FaqDocument>) {}

  async findAll() {
    return this.faqModel.find().sort({ createdAt: -1 }).lean({ virtuals: true }).exec();
  }

  async findOne(id: string) {
    const doc = await this.faqModel.findById(id).exec();
    if (!doc) throw new NotFoundException('FAQ not found');
    return doc.toJSON();
  }

  async create(dto: CreateFaqDto) {
    const created = await this.faqModel.create(dto);
    return created.toJSON();
  }

  async update(id: string, dto: UpdateFaqDto) {
    const updated = await this.faqModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!updated) throw new NotFoundException('FAQ not found');
    return updated.toJSON();
  }

  async remove(id: string) {
    const res = await this.faqModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('FAQ not found');
    return { success: true };
  }
}



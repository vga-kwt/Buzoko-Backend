import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { PublicVendorDto } from './dto/public-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(@InjectModel(Vendor.name) private readonly vendorModel: Model<VendorDocument>) {}

  async create(dto: CreateVendorDto): Promise<PublicVendorDto> {
    const created = await this.vendorModel.create(dto);
    return this.toPublic(created);
  }

  async findAll(): Promise<PublicVendorDto[]> {
    const docs = await this.vendorModel.find().sort({ createdAt: -1 }).lean({ virtuals: true }).exec();
    return docs.map(this.toPublic);
  }

  async update(id: string, dto: UpdateVendorDto): Promise<PublicVendorDto> {
    const updated = await this.vendorModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Vendor not found');
    return this.toPublic(updated);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const res = await this.vendorModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Vendor not found');
    return { success: true };
  }

  toPublic(doc: VendorDocument | any): PublicVendorDto {
    const plain = doc.toJSON ? doc.toJSON() : doc;
    return {
      id: plain.id,
      userId: plain.userId?.toString?.() || '',
      title: plain.title,
      avatarUrl: plain.avatarUrl,
      description: plain.description,
      rating: plain.rating,
    };
  }
}

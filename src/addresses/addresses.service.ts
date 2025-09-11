import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>
  ) {}

  async createForUser(userId: string, dto: CreateAddressDto) {
    const userObjectId = new Types.ObjectId(userId);
    const address = await this.addressModel.create({ ...dto, userId: userObjectId });

    if (dto.isDefault) {
      await this.ensureSingleDefault(userObjectId, address._id);
    }
    return address.toJSON();
  }

  async listForUser(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const docs = await this.addressModel
      .find({ userId: userObjectId })
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();
    return docs.map(this.mapIdString);
  }

  async findByIdForUser(userId: string, id: string) {
    const userObjectId = new Types.ObjectId(userId);
    const _id = new Types.ObjectId(id);
    const doc = await this.addressModel.findOne({ _id, userId: userObjectId }).lean();
    if (!doc) throw new NotFoundException('Address not found');
    return this.mapIdString(doc);
  }

  async updateForUser(userId: string, id: string, dto: UpdateAddressDto) {
    const userObjectId = new Types.ObjectId(userId);
    const _id = new Types.ObjectId(id);
    const updated = await this.addressModel
      .findOneAndUpdate({ _id, userId: userObjectId }, { $set: dto }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('Address not found');

    if (dto.isDefault === true) {
      await this.ensureSingleDefault(userObjectId, _id);
    }
    return this.mapIdString(updated);
  }

  async removeForUser(userId: string, id: string) {
    const userObjectId = new Types.ObjectId(userId);
    const _id = new Types.ObjectId(id);
    const doc = await this.addressModel.findOneAndDelete({ _id, userId: userObjectId }).lean();
    if (!doc) throw new NotFoundException('Address not found');
    return { deleted: true };
  }

  async makeDefault(userId: string, id: string) {
    const userObjectId = new Types.ObjectId(userId);
    const _id = new Types.ObjectId(id);
    const exists = await this.addressModel
      .findOneAndUpdate({ _id, userId: userObjectId }, { $set: { isDefault: true } }, { new: true })
      .lean();
    if (!exists) throw new NotFoundException('Address not found');
    await this.ensureSingleDefault(userObjectId, _id);
    return this.mapIdString(exists);
  }

  private async ensureSingleDefault(userObjectId: Types.ObjectId, keepAddressId: Types.ObjectId) {
    await this.addressModel.updateMany(
      { userId: userObjectId, _id: { $ne: keepAddressId }, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  private mapIdString<T extends { _id?: any }>(doc: T): any {
    if (!doc) return doc as any;
    const ret: any = { ...doc };
    if (ret._id != null) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    return ret;
  }
}

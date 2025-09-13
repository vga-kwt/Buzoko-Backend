import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PublicProfileDto } from './dto/public-profile.dto';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(@InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>) {}

  /**
   * Create profile (one-to-one). If profile exists for userId, returns existing.
   */
  async create(createDto: CreateProfileDto): Promise<PublicProfileDto> {
    // ensure userId is ObjectId
    const userId = new Types.ObjectId(createDto.userId);

    // check existing (fast path)
    const existing = await this.profileModel.findOne({ userId }).exec();
    if (existing) {
      return this.toPublic(existing);
    }

    try {
      const created = await this.profileModel.create({
        userId,
        fullName: createDto.fullName,
        avatarUrl: createDto.avatarUrl,
        dob: createDto.dob ? new Date(createDto.dob) : undefined,
        gender: createDto.gender,
        locale: createDto.locale,
      });

      this.logger.log(`Profile created for user ${userId}`);
      return this.toPublic(created);
    } catch (err: any) {
      // Handle race condition: unique index violation on userId
      if (err && err.code === 11000) {
        const doc = await this.profileModel.findOne({ userId }).exec();
        if (doc) return this.toPublic(doc);
      }
      throw err;
    }
  }

  /**
   * Find profile by profile id
   */
  async findById(id: string): Promise<ProfileDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Profile not found');
    const doc = await this.profileModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Profile not found');
    return doc;
  }

  /**
   * Find profile by user id
   */
  async findByUserId(userId: string): Promise<ProfileDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return this.profileModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  /**
   * Update profile (partial)
   */
  async update(id: string, updateDto: UpdateProfileDto): Promise<PublicProfileDto> {
    // Strict one-to-one: never allow changing the userId via update
    const { userId: _ignore, ...safeUpdate } = (updateDto as any) || {};
    const updated = await this.profileModel
      .findByIdAndUpdate(id, { $set: safeUpdate }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Profile not found');
    return this.toPublic(updated);
  }

  /**
   * Delete profile
   */
  async remove(id: string): Promise<{ success: boolean }> {
    const res = await this.profileModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Profile not found');
    return { success: true };
  }

  /**
   * Convert a Mongoose document to PublicProfileDto
   */
  toPublic(doc: ProfileDocument, userId?: string): PublicProfileDto {
    const plain = doc.toJSON ? doc.toJSON() : doc;
  
    const dto = plainToInstance(PublicProfileDto, plain, {
      excludeExtraneousValues: true,
    });
  
    // ✅ append userId
    if (userId) {
      dto.userId = userId.toString();
    } else if (doc.userId) {
      dto.userId = doc.userId.toString();
    }
  
    return dto;
  }
  
}

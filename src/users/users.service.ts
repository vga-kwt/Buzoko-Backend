import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { UserStatus, UserRole } from './schemas/user.enums';
import { plainToInstance } from 'class-transformer';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new user. Phone is required; if a user with the phone already exists,
   * this returns the existing user (idempotent create).
   *
   * This behavior fits OTP-first flows where a user record may be created when
   * an OTP is issued/verified.
   */
  async create(createUserDto: CreateUserDto): Promise<PublicUserDto> {
    const phone = createUserDto.phoneE164;

    // Quick validation
    if (!phone) {
      throw new BadRequestException('phoneE164 is required');
    }

    // If user already exists with this phone, return public projection (idempotent).
    const existing = await this.userModel.findOne({ phoneE164: phone }).exec();
    if (existing) {
      return this.toPublic(existing);
    }

    const created = await this.userModel.create({
      phoneE164: phone,
      email: createUserDto.email,
      roles: createUserDto.roles ?? undefined,
      metadata: createUserDto.metadata ?? undefined,
      registrationType: createUserDto.registrationType ?? undefined,
    });

    this.logger.log(`Created user ${created._id} (phone=${phone})`);
    // Ensure default notifications document exists with defaults true/true
    try {
      await this.notificationsService.updateUserNotifications(created._id.toString(), {});
    } catch (e: any) {
      this.logger.warn(`Failed to initialize notifications for user ${created._id}: ${e && typeof e === 'object' && 'message' in e ? (e as any).message : e}`);
    }
    return this.toPublic(created);
  }

  /**
   * Find user by id. Throws NotFoundException if not found.
   */
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).populate('addresses').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Find user by phone E.164. Returns null if not found.
   */
  async findByPhone(phoneE164: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phoneE164 }).exec();
  }

  /**
   * Find user by email. Returns null if not found.
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email?.toLowerCase() }).exec();
  }

  /**
   * Create a new user by email (idempotent). If a user exists with this email,
   * return the existing user as PublicUserDto.
   */
  async createByEmail(email: string): Promise<PublicUserDto> {
    const normalized = email?.toLowerCase();
    if (!normalized) {
      throw new BadRequestException('email is required');
    }
    const existing = await this.userModel.findOne({ email: normalized }).exec();
    if (existing) return this.toPublic(existing);

    const created = await this.userModel.create({ email: normalized });
    this.logger.log(`Created user ${created._id} (email=${normalized})`);
    try {
      await this.notificationsService.updateUserNotifications(created._id.toString(), {});
    } catch (e: any) {
      this.logger.warn(
        `Failed to initialize notifications for user ${created._id}: ${
          e && typeof e === 'object' && 'message' in e ? (e as any).message : e
        }`
      );
    }
    return this.toPublic(created);
  }

  /** Mark email as verified and set emailVerifiedAt */
  async markEmailVerified(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { $set: { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE } })
      .exec();
  }

  /**
   * Update user by id. Returns PublicUserDto.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<PublicUserDto> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('User not found');
    return this.toPublic(updated);
  }

  /**
   * Soft-delete (or block) user by setting status to BLOCKED.
   */
  async blockUser(id: string) {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: { status: 'blocked' } }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return this.toPublic(updated);
  }

  /**
   * Mark phone as verified and set phoneVerifiedAt
   */
  async markPhoneVerified(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { $set: { phoneVerifiedAt: new Date(), status: UserStatus.ACTIVE } })
      .exec();
  }

  /**
   * Update lastLoginAt timestamp
   */
  async setLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }).exec();
  }

  /**
   * Update lastLoginAt timestamp
   */
  async set(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }).exec();
  }

  /**
   * If the user has client role, set status to ACTIVE (idempotent)
   */
  async activateIfClient(id: string): Promise<void> {
    const user = await this.userModel.findById(id).select(['roles', 'status']).exec();
    if (!user) return;
    const hasClient = Array.isArray(user.roles) && user.roles.includes(UserRole.CLIENT);
    if (hasClient && user.status !== UserStatus.ACTIVE) {
      await this.userModel.findByIdAndUpdate(id, { $set: { status: UserStatus.ACTIVE } }).exec();
    }
  }

  /**
   * Convert a Mongoose user doc to PublicUserDto using the schema's toJSON transform.
   */
  toPublic(userDoc: UserDocument): PublicUserDto {
    const plain = userDoc.toJSON ? userDoc.toJSON() : userDoc;
    return plainToInstance(PublicUserDto, plain, { excludeExtraneousValues: true });
  }

  /**
   * Find user and include passwordHash (select +passwordHash)
   */
  async findByPhoneWithPassword(phoneE164: string) {
    return this.userModel.findOne({ phoneE164 }).select('+passwordHash').exec();
  }

  /**
   * Find user by id and include passwordHash (select +passwordHash)
   */
  async findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+passwordHash').exec();
  }

  /**
   * Set passwordHash for user (hashing done in caller or here).
   */
  async setPasswordHash(userId: string, passwordHash: string) {
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $set: { passwordHash } }, { new: true })
      .select('+passwordHash')
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  /**
   * Create user with passwordHash (if user doesn't exist).
   * Returns public projection (or you can return doc with password by selecting).
   */
  async createWithPassword(createDto: any, passwordHash: string) {
    // Try to find existing by phone
    const existing = await this.userModel.findOne({ phoneE164: createDto.phoneE164 }).exec();
    if (existing) {
      // If exists and already has a passwordHash -> caller should handle conflict
      if (existing.passwordHash) {
        throw new BadRequestException('User already registered with password');
      }
      // otherwise set passwordHash and optionally update email
      existing.passwordHash = passwordHash;
      if (createDto.email) existing.email = createDto.email;
      await existing.save();
      // Ensure notifications defaults exist
      try {
        await this.notificationsService.updateUserNotifications(existing._id.toString(), {});
      } catch (e: any) {
        this.logger.warn(`Failed to initialize notifications for user ${existing._id}: ${e && typeof e === 'object' && 'message' in e ? (e as any).message : e}`);
      }
      return this.toPublic(existing as any);
    }

    const created = await this.userModel.create({
      phoneE164: createDto.phoneE164,
      email: createDto.email,
      passwordHash,
      roles: createDto.roles ?? undefined,
      metadata: createDto.metadata ?? undefined,
      registrationType: createDto.registrationType ?? undefined,
    });
    try {
      await this.notificationsService.updateUserNotifications(created._id.toString(), {});
    } catch (e: any) {
      this.logger.warn(`Failed to initialize notifications for user ${created._id}: ${e && typeof e === 'object' && 'message' in e ? (e as any).message : e}`);
    }
    return this.toPublic(created as any);
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, UserStatus, RegistrationType } from './user.enums';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.CLIENT],
    index: true,
  })
  roles!: UserRole[];

  @Prop({
    type: String,
    trim: true,
    match: /^\+[1-9]\d{1,14}$/,
    unique: true,
    sparse: true,
  })
  phoneE164?: string;

  @Prop({ type: Date })
  phoneVerifiedAt?: Date;

  @Prop({ type: String, trim: true, lowercase: true, unique: true, sparse: true })
  email?: string;

  @Prop({ type: Date })
  emailVerifiedAt?: Date;

  @Prop({ type: String, select: false })
  passwordHash?: string;

  @Prop({ type: String, enum: Object.values(UserStatus), default: UserStatus.PENDING, index: true })
  status!: UserStatus;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  // Added flexibility fields for future updates
  @Prop({ type: Map, of: String })
  metadata?: Record<string, string>;

  @Prop({ type: String, enum: Object.values(RegistrationType), default: RegistrationType.PHONE })
  registrationType!: RegistrationType;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual relation: one User -> many Addresses
UserSchema.virtual('addresses', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'userId',
  options: { sort: { isDefault: -1, updatedAt: -1 } },
});

UserSchema.index({ phoneE164: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ roles: 1, status: 1 });

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    // Ensure id is a string, not ObjectId
    if (ret._id != null) {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Gender } from './profile.enums';
import { User } from '../../users/schemas/user.schema';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({
  collection: 'profiles',
  timestamps: true,
  versionKey: false,
})
export class Profile {
  /**
   * Reference to User (one-to-one). Unique to enforce one profile per user.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: String, trim: true, maxlength: 240 })
  fullName?: string;

  @Prop({ type: String, trim: true })
  avatarUrl?: string;

  @Prop({ type: Date })
  dob?: Date;

  @Prop({ type: String, enum: Object.values(Gender), default: Gender.UNKNOWN })
  gender?: Gender;

  @Prop({ type: String, trim: true, maxlength: 10 })
  locale?: string;
}

/**
 * Schema factory + indexes and transforms
 */
export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Ensure a unique index on userId (one-to-one)
ProfileSchema.index({ userId: 1 }, { unique: true });

// Public projection helper: include only safe fields when needed
ProfileSchema.methods.toPublic = function () {
  const obj = this.toObject({ virtuals: true });
  return {
    id: obj._id,
    fullName: obj.fullName,
    avatarUrl: obj.avatarUrl,
    locale: obj.locale,
    gender: obj.gender,
  };
};

// Standard toJSON transform: expose `id`, hide `_id`
ProfileSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

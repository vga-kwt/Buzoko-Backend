import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type KycDocument = HydratedDocument<Kyc>;

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ collection: 'kyc', timestamps: true, versionKey: false })
export class Kyc {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  label!: string;

  @Prop({ type: [String], default: [] })
  urls!: string[];

  @Prop({ type: String, enum: Object.values(KycStatus), default: KycStatus.PENDING, index: true })
  status!: KycStatus;
}

export const KycSchema = SchemaFactory.createForClass(Kyc);

KycSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    if (ret._id != null) ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});



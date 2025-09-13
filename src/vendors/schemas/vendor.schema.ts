import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type VendorDocument = HydratedDocument<Vendor>;

@Schema({ collection: 'vendors', timestamps: true, versionKey: false })
export class Vendor {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  title!: string;

  @Prop({ type: String, trim: true })
  avatarUrl?: string;

  @Prop({ type: String, trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  rating!: number;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

VendorSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    if (ret._id != null) ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

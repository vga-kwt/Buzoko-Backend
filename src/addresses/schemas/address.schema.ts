import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type AddressDocument = HydratedDocument<Address>;

@Schema({
  collection: 'addresses',
  timestamps: true,
  versionKey: false,
})
export class Address {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, trim: true, maxlength: 50 })
  label?: string;

  @Prop({ type: String, trim: true, maxlength: 250 })
  areaRegion?: string;

  @Prop({ type: String, trim: true, maxlength: 20, match: /^[A-Za-z0-9 ]*$/u })
  block?: string;

  @Prop({ type: String, trim: true, maxlength: 50, match: /^[A-Za-z0-9 ]*$/u })
  street?: string;

  @Prop({ type: String, trim: true, maxlength: 20 })
  buildingNo?: string;

  @Prop({ type: String, trim: true, maxlength: 20 })
  floorNo?: string;

  @Prop({ type: String, trim: true, maxlength: 10 })
  apartmentNo?: string;

  @Prop({ type: Boolean, default: false, index: true })
  isDefault!: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

AddressSchema.index({ userId: 1, isDefault: 1 });

AddressSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    if (ret._id != null) {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    return ret;
  },
});



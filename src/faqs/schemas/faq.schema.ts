import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FaqDocument = HydratedDocument<Faq>;

@Schema({ collection: 'faqs', timestamps: true, versionKey: false })
export class Faq {
  @Prop({ type: String, required: true, trim: true, maxlength: 255 })
  questionEn!: string;

  @Prop({ type: String, required: true, trim: true })
  answerEn!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 255 })
  questionAr!: string;

  @Prop({ type: String, required: true, trim: true })
  answerAr!: string;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);

FaqSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    if (ret._id != null) ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});



import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TreatmentBenefitDocment = HydratedDocument<TreatmentBenefit>;

@Schema({ timestamps: true })
export class TreatmentBenefit {
  @Prop()
  title: string;

  @Prop()
  category: string;

  @Prop()
  description: string;

  @Prop({
    type: [
      {
        question: {
          type: String,
        },
        options: { type: [String] },
        answare: { type: String },
      },
    ],
    default: [],
  })
  treatmentQuestions: {
    question: string;
    options: string[];
    answare?: string;
  }[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createBy: Types.ObjectId;
}

export const TreatmentBenefitSchema =
  SchemaFactory.createForClass(TreatmentBenefit);

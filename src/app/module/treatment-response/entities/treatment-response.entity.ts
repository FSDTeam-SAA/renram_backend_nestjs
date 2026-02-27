import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TreatmentResponseDocument = HydratedDocument<TreatmentResponse>;

@Schema({ timestamps: true })
export class TreatmentResponse {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment',
    required: true,
  })
  treatment: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        question: { type: String },
        selectedAnswer: { type: String },
        correctAnswer: { type: String },
        isCorrect: { type: Boolean },
      },
    ],
    default: [],
  })
  answers: {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ default: 0 })
  correctCount: number;

  @Prop({ default: 0 })
  wrongCount: number;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const TreatmentResponseSchema =
  SchemaFactory.createForClass(TreatmentResponse);

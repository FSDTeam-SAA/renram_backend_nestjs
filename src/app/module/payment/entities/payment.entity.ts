import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: mongoose.Types.ObjectId;

  @Prop({
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        qty: { type: Number, default: 1 },
        size: { type: String },
        price: { type: Number, required: true },
      },
    ],
    default: [],
  })
  items: {
    product: Types.ObjectId;
    qty: number;
    size?: string;
    price: number;
  }[];

  @Prop({ required: true })
  amount: number;

  @Prop()
  stripeSessionId: string;

  @Prop()
  stripePaymentIntentId: string;

  @Prop()
  paymentType: string;

  @Prop({ default: 'usd' })
  currency: string;

  @Prop({
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  status: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

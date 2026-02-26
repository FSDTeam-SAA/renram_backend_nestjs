import { HttpException, Injectable } from '@nestjs/common';
import { CreateCheckoutDto, CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../product/entities/product.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import Stripe from 'stripe';
import config from 'src/app/config';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {
    this.stripe = new Stripe(config.stripe.secretKey!);
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productModel.find({ _id: { $in: productIds } });

    if (!products.length) throw new HttpException('No products found', 400);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let total = 0;

    const itemsSnapshot = dto.items.map((i) => {
      const p = products.find((x) => x._id.toString() === i.productId);
      if (!p) throw new HttpException(`Invalid product: ${i.productId}`, 400);

      total += p.price * i.qty;

      line_items.push({
        quantity: i.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(p.price * 100), // dollars->cents
          product_data: {
            name: p.name,
            description: p.description,
            images: p.image?.length ? [p.image[0]] : undefined,
          },
        },
      });

      return {
        product: p._id,
        qty: i.qty,
        size: i.size,
        price: p.price,
      };
    });

    const payment = await this.paymentModel.create({
      user: new Types.ObjectId(userId),
      items: itemsSnapshot,
      amount: total,
      currency: 'usd',
      status: 'pending',
      paymentType: 'product',
    });

    // 3) create stripe session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/payment-faild`,
      metadata: {
        paymentId: payment._id.toString(),
        paymentType: 'product',
      },
    });

    payment.stripeSessionId = session.id;
    await payment.save();

    return { url: session.url, sessionId: session.id };
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './app/module/user/user.module';
import { AuthModule } from './app/module/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import config from './app/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './app/module/product/product.module';
import { WebhookModule } from './app/module/webhook/webhook.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { TreatmentModule } from './app/module/treatment/treatment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri!),
    UserModule,
    AuthModule,
    ProductModule,
    WebhookModule,
    PaymentModule,
    TreatmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

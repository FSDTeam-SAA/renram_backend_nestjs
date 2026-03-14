import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-payment.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';

@Controller('payment')
@ApiTags('Payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @UseGuards(AuthGuard('user'))
  @ApiBearerAuth('access-token')
  async checkout(@Req() req: Request, @Body() dto: CreateCheckoutDto) {
    const userId = req.user!.id;
    return this.paymentService.createCheckoutSession(userId, dto);
  }
}

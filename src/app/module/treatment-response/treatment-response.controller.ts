import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TreatmentResponseService } from './treatment-response.service';
import { CreateTreatmentResponseDto } from './dto/create-treatment-response.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';

@Controller('treatment-response')
export class TreatmentResponseController {
  constructor(
    private readonly treatmentResponseService: TreatmentResponseService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('user'))
  @HttpCode(HttpStatus.OK)
  async submit(@Req() req: Request, @Body() dto: CreateTreatmentResponseDto) {
    const result = await this.treatmentResponseService.submitResponse(
      req.user!.id,
      dto,
    );

    return {
      message: 'Treatment submitted successfully',
      data: result,
    };
  }

  @Get('my-dashboard')
  @UseGuards(AuthGuard('user'))
  async myDashboard(@Req() req: Request) {
    const result = await this.treatmentResponseService.myDashboard(
      req.user!.id,
    );

    return {
      message: 'Dashboard retrieved successfully',
      data: result,
    };
  }
}

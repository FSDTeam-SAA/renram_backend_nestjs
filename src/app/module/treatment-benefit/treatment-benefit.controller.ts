import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Put,
} from '@nestjs/common';
import { TreatmentBenefitService } from './treatment-benefit.service';
import { CreateTreatmentBenefitDto } from './dto/create-treatment-benefit.dto';
import { UpdateTreatmentBenefitDto } from './dto/update-treatment-benefit.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('treatment-benefit')
export class TreatmentBenefitController {
  constructor(
    private readonly treatmentBenefitService: TreatmentBenefitService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async createTreatmentBenefit(
    @Req() req: Request,
    @Body() createTreatmentBenefitDto: CreateTreatmentBenefitDto,
  ) {
    const result = await this.treatmentBenefitService.createTreatmentBenefit(
      req.user!.id,
      createTreatmentBenefitDto,
    );

    return { message: 'Treatment benefit created successfully', data: result };
  }

  @Get()
  async getAllTreatmentBenefit(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'description',
      'category',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.treatmentBenefitService.getAllTreatmentBenefit(
      filters,
      options,
    );

    return {
      message: 'Treatment benefit retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  async getSingleTreatmentBenefit(@Param('id') id: string) {
    const result =
      await this.treatmentBenefitService.getSingleTreatmentBenefit(id);

    return {
      message: 'Treatment benefit retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async updateTreatmentBenefit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTreatmentBenefitDto: UpdateTreatmentBenefitDto,
  ) {
    const result = await this.treatmentBenefitService.updateTreatmentBenefit(
      req.user!.id,
      id,
      updateTreatmentBenefitDto,
    );

    return {
      message: 'Treatment benefit updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteTreatmentBenefit(@Req() req: Request, @Param('id') id: string) {
    const result = await this.treatmentBenefitService.deleteTreatmentBenefit(
      req.user!.id,
      id,
    );

    return {
      message: 'Treatment benefit deleted successfully',
      data: result,
    };
  }
}

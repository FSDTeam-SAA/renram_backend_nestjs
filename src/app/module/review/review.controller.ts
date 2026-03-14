import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('review')
@ApiTags('Review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('product/:productId')
  @UseGuards(AuthGuard('user'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Req() req: Request,
    @Body() createReviewDto: CreateReviewDto,
    @Param('productId') productId: string,
  ) {
    const userId = req.user!.id;
    const result = await this.reviewService.createReview(
      userId,
      createReviewDto,
      productId,
    );

    return {
      message: 'Review created successfully',
      data: result,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllReviews(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'message',
      'rating',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.reviewService.getAllReviews(filters, options);
    return {
      message: 'Reviews retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSingleReview(@Param('id') id: string) {
    const result = await this.reviewService.getSingleReview(id);
    return {
      message: 'Review retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('user', 'admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async updateReview(
    @Req() req: Request,
    @Body() updateReviewDto: UpdateReviewDto,
    @Param('id') id: string,
  ) {
    const userId = req.user!.id;
    const result = await this.reviewService.updateReview(
      userId,
      id,
      updateReviewDto,
    );
    return {
      message: 'Review updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('user', 'admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async deleteReview(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user!.id;
    const result = await this.reviewService.deleteReview(userId, id);

    return {
      message: 'Review deleted successfully',
      data: result,
    };
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewDocument } from './entities/review.entity';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../product/entities/product.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createReview(
    userId: string,
    createReviewDto: CreateReviewDto,
    productId: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User is not found', 404);

    const product = await this.productModel.findById(productId);
    if (!product) throw new HttpException('Product is not found', 404);

    // const alreadyReviewed = await this.reviewModel.findOne({
    //   user: user._id,
    //   product: product._id,
    // });

    // if (alreadyReviewed) {
    //   throw new HttpException('You already reviewed this product', 400);
    // }

    const review = await this.reviewModel.create({
      message: createReviewDto.message,
      rating: createReviewDto.rating,
      name: `${user.firstName} ${user.lastName}`,
      user: user._id,
      product: product._id,
    });

    product.reviews.push(review._id);
    await product.save();

    return review;
  }

  async getAllReviews(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { searchTerm, ...filterData } = params;

    const andCondition: any[] = [];
    const searchAbleFields = ['name', 'message'];

    if (searchTerm) {
      andCondition.push({
        $or: searchAbleFields.map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: 'i',
          },
        })),
      });
    }

    if (Object.keys(filterData).length > 0) {
      andCondition.push({
        $and: Object.entries(filterData).map(([key, value]) => ({
          [key]: value,
        })),
      });
    }

    const whereConditions =
      andCondition.length > 0 ? { $and: andCondition } : {};

    const result = await this.reviewModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder } as any)
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName profilePicture email phoneNumber')
      .populate('product', 'name');
    const total = await this.reviewModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleReview(id: string) {
    const result = await this.reviewModel
      .findById(id)
      .populate('user', 'firstName lastName profilePicture email phoneNumber')
      .populate('product', 'name');
    if (!result) {
      throw new HttpException('Review not found', 404);
    }
    return result;
  }

  async updateReview(
    userId: string,
    id: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User is not found', 404);
    const review = await this.reviewModel.findById(id);
    if (!review) throw new HttpException('Review not found', 404);

    if (user.role !== 'admin') {
      if (review.user.toString() !== userId)
        throw new HttpException(
          'You are not authorized to update this review',
          401,
        );
    }

    const result = await this.reviewModel.findByIdAndUpdate(
      id,
      updateReviewDto,
      {
        new: true,
      },
    );
    return result;
  }

  async deleteReview(userId: string, id: string) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new HttpException('User is not found', 404);

    const review = await this.reviewModel.findById(id);
    if (!review) throw new HttpException('Review not found', 404);

    if (user.role !== 'admin') {
      if (review.user.toString() !== userId)
        throw new HttpException(
          'You are not authorized to update this review',
          401,
        );
    }

    await this.productModel.findByIdAndUpdate(review.product, {
      $pull: { reviews: id },
    });

    const result = await this.reviewModel.findByIdAndDelete(id);
    return result;
  }
}

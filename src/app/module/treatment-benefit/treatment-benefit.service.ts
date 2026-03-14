import { HttpException, Injectable } from '@nestjs/common';
import { CreateTreatmentBenefitDto } from './dto/create-treatment-benefit.dto';
import { UpdateTreatmentBenefitDto } from './dto/update-treatment-benefit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TreatmentBenefit,
  TreatmentBenefitDocment,
} from './entities/treatment-benefit.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';

@Injectable()
export class TreatmentBenefitService {
  constructor(
    @InjectModel(TreatmentBenefit.name)
    private readonly treatmentBenefitModel: Model<TreatmentBenefitDocment>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createTreatmentBenefit(
    userId: string,
    createTreatmentDto: CreateTreatmentBenefitDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('user not found', 404);
    const result = await this.treatmentBenefitModel.create({
      ...createTreatmentDto,
      createBy: user._id,
    });
    if (!result) throw new HttpException('treatment benefit create faild', 500);
    return result;
  }

  async getAllTreatmentBenefit(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { searchTerm, ...filterData } = params;

    const andCondition: any[] = [];
    const searchAbleFields = ['title', 'description', 'category'];

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

    const result = await this.treatmentBenefitModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder } as any)
      .skip(skip)
      .limit(limit)
      .populate(
        'createBy',
        'firstName lastName profilePicture email phoneNumber',
      );
    const total =
      await this.treatmentBenefitModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleTreatmentBenefit(id: string) {
    const result = await this.treatmentBenefitModel.findById(id);
    if (!result) throw new HttpException('treatment not found', 404);
    return result;
  }

  async updateTreatmentBenefit(
    userId: string,
    id: string,
    updateTreatmentDto: UpdateTreatmentBenefitDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('user not found', 404);

    const isExist = await this.treatmentBenefitModel.findById(id);
    if (!isExist) throw new HttpException('treatment benefit not found', 404);

    if (isExist.createBy.toString() !== user._id.toString()) {
      throw new HttpException('not authorized', 403);
    }

    const result = await this.treatmentBenefitModel.findByIdAndUpdate(
      id,
      updateTreatmentDto,
      {
        new: true,
      },
    );
    if (!result)
      throw new HttpException('treatment benefit update failed', 500);
    return result;
  }

  async deleteTreatmentBenefit(userId: string, id: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('user not found', 404);
    const isExist = await this.treatmentBenefitModel.findById(id);

    if (!isExist) throw new HttpException('treatment benefit not found', 404);
    if (isExist.createBy.toString() !== user._id.toString()) {
      throw new HttpException('not authorized', 403);
    }
    const result = await this.treatmentBenefitModel.findByIdAndDelete(id);
    if (!result)
      throw new HttpException('treatment benefit delete failed', 500);
    return result;
  }
}

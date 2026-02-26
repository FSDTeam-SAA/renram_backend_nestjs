import { HttpException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { fileUpload } from 'src/app/helper/fileUploder';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    const user = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (user)
      throw new HttpException('User with this email already exist', 400);

    if (file) {
      const userProfilePhoto = await fileUpload.uploadToCloudinary(file);
      createUserDto.profilePicture = userProfilePhoto.url;
    }

    const result = await this.userModel.create(createUserDto);
    return result;
  }

  async getAllUsers(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { searchTerm, ...filterData } = params;

    const andCondition: any[] = [];
    const searchAbleFields = [
      'firstName',
      'lastName',
      'email',
      'role',
      'phoneNumber',
      'address',
      'gender',
    ];

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

    const result = await this.userModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder } as any)
      .skip(skip)
      .limit(limit);
    const total = await this.userModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleUser(id: string) {
    const result = await this.userModel.findById(id);
    if (!result) throw new HttpException('User not found', 404);
    return result;
  }

  async updateUserInfo(
    id: string,
    payload: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const isExist = await this.userModel.findById(id);
    if (!isExist) throw new HttpException('User not found', 404);

    if (file) {
      const profileImage = await fileUpload.uploadToCloudinary(file);
      payload.profilePicture = profileImage.url;
    }

    const result = await this.userModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result;
  }

  async deleteUser(id: string) {
    const isExist = await this.userModel.findById(id);
    if (!isExist) throw new HttpException('User not found', 404);
    const result = await this.userModel.findByIdAndDelete(id);
    return result;
  }

  async getProfile(id: string) {
    const result = await this.userModel.findById(id);
    if (!result) throw new HttpException('User not found', 404);
    return result;
  }

  async updateProfile(
    id: string,
    payload: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const isExist = await this.userModel.findById(id);
    if (!isExist) throw new HttpException('User not found', 404);

    if (file) {
      const profileImage = await fileUpload.uploadToCloudinary(file);
      payload.profilePicture = profileImage.url;
    }

    const result = await this.userModel.findByIdAndUpdate(
      id,
      { payload },
      {
        new: true,
      },
    );
    return result;
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Contact, ContactDocument } from './entities/contact.entity';
import { Model } from 'mongoose';
import { CreateContactDto } from './dto/create-contact.dto';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async createContact(createContactDto: CreateContactDto) {
    const result = await this.contactModel.create(createContactDto);
    if (!result) throw new HttpException('Contact not created', 400);

    return result;
  }

  async getAllContact(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { searchTerm, ...filterData } = params;

    const andCondition: any[] = [];
    const searchAbleFields = ['name', 'message', 'email', 'phoneNumber'];

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

    const result = await this.contactModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder } as any)
      .skip(skip)
      .limit(limit);

    const total = await this.contactModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleContact(id: string) {
    const result = await this.contactModel.findById(id);
    if (!result) throw new HttpException('Contact not found', 404);

    return result;
  }

  async deleteContact(id: string) {
    const result = await this.contactModel.findByIdAndDelete(id);
    if (!result) throw new HttpException('Contact not deleted', 400);

    return result;
  }
}

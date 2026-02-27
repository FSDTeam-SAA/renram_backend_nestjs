import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createContact(@Body() createContactDto: CreateContactDto) {
    const result = await this.contactService.createContact(createContactDto);

    return {
      message: 'Contact create successfully',
      data: result,
    };
  }

  @Get()
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getAllContact(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'message',
      'email',
      'phoneNumber',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.contactService.getAllContact(filters, options);

    return {
      message: 'Contact retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSingleContact(@Param('id') id: string) {
    const result = await this.contactService.getSingleContact(id);
    return {
      message: 'Contact retrieved successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  deleteContact(@Param('id') id: string) {
    const result = this.contactService.deleteContact(id);

    return {
      message: 'Contact deleted successfully',
      data: result,
    };
  }
}

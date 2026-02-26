import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Req,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileUpload } from 'src/app/helper/fileUploder';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.userService.createUser(createUserDto, file);

    return {
      message: 'User is create successfully',
      data: result,
    };
  }

  @Get('all-users')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async findAllUsers(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'firstName',
      'lastName',
      'phoneNumber',
      'email',
      'role',
      'address',
      'gender',
    ]);

    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.userService.getAllUsers(filters, options);
    return {
      message: 'All users retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard('user', 'admin'))
  @HttpCode(HttpStatus.OK)
  async findProfile(@Req() req: Request) {
    const result = await this.userService.getProfile(req.user!.id);
    return {
      message: 'User profile retrieved successfully',
      data: result,
    };
  }

  @Put('profile')
  @UseGuards(AuthGuard('user', 'admin'))
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.userService.updateUserInfo(
      req.user!.id,
      updateUserDto,
      file,
    );
    return {
      message: 'User profile updated successfully',
      data: result,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findSingleUser(@Param('id') id: string) {
    const result = await this.userService.getSingleUser(id);
    return {
      message: 'User retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log(UpdateUserDto);
    const result = await this.userService.updateUserInfo(
      id,
      updateUserDto,
      file,
    );
    return {
      message: 'User updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.deleteUser(id);
    return {
      message: 'User deleted successfully',
      data: result,
    };
  }
}

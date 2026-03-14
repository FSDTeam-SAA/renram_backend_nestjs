import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateAuthDto,
  ForgotPasswordDto,
  LoginAuthDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/create-auth.dto';
import type { Request, Response } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createAuthDto: CreateAuthDto) {
    const result = await this.authService.register(createAuthDto);

    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and return access token' })
  @ApiBody({ type: LoginAuthDto })
  @ApiOkResponse({
    description: 'User logged in successfully',
    schema: {
      example: {
        message: 'User logged in successfully',
        data: {
          accessToken: 'jwt-token-here',
          user: {
            _id: '67d3f5d5a3c1c82c1d123456',
            email: 'saurav@example.com',
            role: 'user',
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() createAuthDto: LoginAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(createAuthDto, res);

    return {
      message: 'User logged in successfully',
      data: result,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send password reset OTP to email' })
  @ApiBody({ type: ForgotPasswordDto })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() createAuthDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(createAuthDto.email);

    return {
      message: 'Email sent successfully',
      data: result,
    };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP sent to email' })
  @ApiBody({ type: VerifyEmailDto })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() createAuthDto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(
      createAuthDto.email,
      createAuthDto.otp,
    );
    return {
      message: 'Email verified successfully',
      data: result,
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password after OTP verification' })
  @ApiBody({ type: ResetPasswordDto })
  @HttpCode(HttpStatus.OK)
  async resetPasswordChange(@Body() CreateAuthDto: ResetPasswordDto) {
    const result = await this.authService.resetPasswordChange(
      CreateAuthDto.email,
      CreateAuthDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
      data: result,
    };
  }

  @Post('change-password')
  @UseGuards(AuthGuard('user', 'admin'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password for logged in user' })
  @ApiBody({ type: ChangePasswordDto })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() CreateAuthDto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    console.log(req.user!.id);
    const result = await this.authService.changePassword(
      req.user!.id,
      CreateAuthDto.oldPassword,
      CreateAuthDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
      data: result,
    };
  }
}

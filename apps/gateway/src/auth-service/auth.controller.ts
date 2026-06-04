import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  Headers,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  CreateUserDto,
  VerifyOtpDto,
} from "apps/auth-service/src/dtos/create-user-dto";
import type { Response } from "express";
import { LoginDto } from "apps/auth-service/src/dtos/login.dto";
import {
  ChangePasswordDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
} from "apps/auth-service/src/dtos/password-reset.dto";
import { UpdateUserDto } from "apps/auth-service/src/dtos/update-user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async registerUser(@Body() dto: CreateUserDto) {
    return await this.authService.registerUser(dto);
  }
  @Post("verify")
  async verifyRegisterUser(@Body() dto: VerifyOtpDto) {
    return await this.authService.verifyRegisterUser(dto);
  }

  @Get("google")
  async getGoogleUserRegistration(@Res() res: Response) {
    return res.redirect("http://localhost:3001/api/v1/auth/google");
  }
  @Get("google/callback")
  async googleUserRegistration(@Res() res: Response) {
    return res.redirect("http://localhost:3001/api/v1/auth/google/callback");
  }

  @Get("users")
  async getAllUsers(@Headers("authorization") authToken: string) {
    const token = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`;
    return this.authService.getAllUsers(token);
  }
  @Get("user")
  async getLoggedInUser(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.authService.getAUser(formattedToken);
  }

  @Post("change-password")
  async changePassword(
    @Headers("authorization") token: string,
    @Body() dto: ChangePasswordDto
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return this.authService.changePassword(formattedToken, dto);
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("forgot-password")
  async(@Body() email: string) {
    return this.authService.forgotPassword(email);
  }
  @Post("login")
  async loginUser(@Body() dto: LoginDto) {
    return this.authService.loginUser(dto);
  }

  @Post("logout")
  async logout(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return this.authService.logout(formattedToken);
  }

  @Post("logout-all")
  async logoutAll(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return this.authService.logoutAll(formattedToken);
  }

  @Post("refresh-token")
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post("resend-otp")
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Patch("me")
  async updateUserData(@Headers("authorization") token: string, @Body() dto: UpdateUserDto) {
    const formatToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return await this.authService.updateUserData(formatToken, dto);
  }

  @Post("me/image")
  async updateUserImage(
    @Headers("authorization") token,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    const formatToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return await this.authService.updateUserImage(formatToken, file);
  }
}

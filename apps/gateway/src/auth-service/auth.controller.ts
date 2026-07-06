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
  UseInterceptors,
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
  ForgotPasswordDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
} from "apps/auth-service/src/dtos/password-reset.dto";
import { UpdateUserDto } from "apps/auth-service/src/dtos/update-user.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiTags } from "@nestjs/swagger";
import {
  ApiAuth,
  ApiCreate,
  ApiGetService,
  ApiPost,
  ApiProtectedFileUpload,
  ApiProtectedGetAll,
  ApiProtectedGetService,
  ApiProtectedUpdate,
  ApiUpdateNew,
  ApiVerify,
} from "libs/decorator/swagger.decorator";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCreate("Register a new buyer account", CreateUserDto)
  @Post("register")
  async registerUser(@Body() dto: CreateUserDto) {
    return await this.authService.registerUser(dto);
  }

  @ApiVerify("OTP verified successfully", VerifyOtpDto)
  @Post("verify")
  async verifyRegisterUser(@Body() dto: VerifyOtpDto) {
    return await this.authService.verifyRegisterUser(dto);
  }

  @ApiGetService("Redirecting to Google OAuth")
  @Get("google")
  async getGoogleUserRegistration(@Res() res: Response) {
    return res.redirect("http://localhost:3001/api/v1/auth/google");
  }
  @ApiGetService("Google OAuth callback")
  @Get("google/callback")
  async googleUserRegistration(@Res() res: Response) {
    return res.redirect("http://localhost:3001/api/v1/auth/google/callback");
  }
  @ApiProtectedGetAll("Get all users")
  @Get("users")
  async getAllUsers(@Headers("authorization") authToken: string) {
    const token = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`;
    return this.authService.getAllUsers(token);
  }
  @ApiProtectedGetAll("Get logged in user profile")
  @Get("user")
  async getLoggedInUser(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.authService.getAUser(formattedToken);
  }
  @ApiProtectedUpdate("Change password", ChangePasswordDto)
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

  @ApiPost("Password reset successfully", ResetPasswordDto)
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiPost("Forgot password OTP sent", ForgotPasswordDto)
  @Post("forgot-password")
  async(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @ApiPost("Login successfully", LoginDto)
  @Post("login")
  async loginUser(@Body() dto: LoginDto) {
    return this.authService.loginUser(dto);
  }

  @ApiProtectedGetService("Logout current session")
  @Post("logout")
  async logout(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return this.authService.logout(formattedToken);
  }
  @ApiProtectedGetService("Logout  all devices")

  @Post("logout-all")
  async logoutAll(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    return this.authService.logoutAll(formattedToken);
  }

  @ApiPost("Refresh token fetched", RefreshTokenDto)
  @Post("refresh-token")
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @ApiPost("Resend OTP sent", ResendOtpDto)
  @Post("resend-otp")
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }
  @ApiProtectedUpdate("Update user profile", UpdateUserDto)

  @Patch("me")
  async updateUserData(
    @Headers("authorization") token: string,
    @Body() dto: UpdateUserDto
  ) {
    const formatToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return await this.authService.updateUserData(formatToken, dto);
  }
  @ApiProtectedFileUpload("Update user profile image")

  @Post("me/image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    })
  )
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

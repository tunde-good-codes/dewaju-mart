import { FileInterceptor } from "@nestjs/platform-express";
import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth-service.service";
import { CreateUserDto, VerifyOtpDto } from "./dtos/create-user-dto";
import { ResponseMessage } from "libs/decorator/response.message.decorator";
import { GoogleAuthGuard } from "./guards/google.auth.guards";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dtos/login.dto";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
} from "./dtos/password-reset.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { memoryStorage } from "multer";

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 120000,
    },
  })
  @Post("register")
  @ResponseMessage("otp sent to the mail provided")
  async registerUser(@Body() dto: CreateUserDto) {
    return this.authService.registerUser(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 120000 } })
  @Post("verify")
  @ResponseMessage("user created successfully")
  async verifyOtpRegisterUSer(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpRegisterUser(dto);
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard) // This guard handles the automatic redirection logic instantly
  async googleAuth() {
    console.log("hello");
  }
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ResponseMessage("Google auth operation is successful")
  async googleCallback(@Req() req) {
    return await this.authService.validateGoogleUser(req.user);
  }

  @Post("login")
  @ResponseMessage("user-login successfully")
  async loginUser(@Body() dto: LoginDto) {
    return await this.authService.loginUser(dto);
  }
  @Get("users")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("user fetched successfully!")
  async getUsers() {
    return this.authService.getUsers();
  }

  @Get("user")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("logged in user fetched")
  async getLoggedInUser(@Req() req) {
    return await this.authService.getLoggedInUser(req.user.id);
  }

  @Post("forgot-password")
  @ResponseMessage("otp sent to the provided email")
  async forgotPassword(@Body() email: ForgotPasswordDto) {
    return await this.authService.forgotPasswordToken(email);
  }

  @Post("reset-password")
  @ResponseMessage("password reset successfully")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.authService.resetPassword(dto);
  }

  @Post("change-password")
  @ResponseMessage("password updated successfully")
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return await this.authService.changePassword(req.user.id, dto);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("logged out successfully")
  async logout(@Req() req) {
    // const token = req.headers.authorization.replace("Bearer ", "");
    return this.authService.logout(req.user.id);
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("logged out from all devices")
  async logoutAll(@Req() req) {
    // const token = req.headers.authorization.replace("Bearer ", "");
    return this.authService.logoutAll(req.user.id);
  }

  @Post("refresh-token")
  @ResponseMessage("tokens refreshed successfully")
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post("resend-otp")
  @ResponseMessage("otp resent successfully")
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email, dto.type);
  }

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("user data updated successfully")
  async updateProfile(@Req() req, @Body() dto: UpdateUserDto) {
    return this.authService.updateUserProfile(req.user.id, dto);
  }

  @ResponseMessage("user profile image updated successfully")
  @Post("me/image")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    })
  )
  async uploadUserImage(
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    return this.authService.uploadUserImage(req.user.id, file);
  }
}

import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
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
  ResetPasswordDto,
} from "./dtos/password-reset.dto";

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
  async changePassword(@Req() id: string, @Body() dto: ChangePasswordDto) {
    return await this.authService.changePassword(id, dto);
  }
}

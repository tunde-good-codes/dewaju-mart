import { Body, Controller, Get, Headers, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  CreateUserDto,
  VerifyOtpDto,
} from "apps/auth-service/src/dtos/create-user-dto";
import type { Response } from "express";
import { LoginDto } from "apps/auth-service/src/dtos/login.dto";
import {
  ChangePasswordDto,
  ResetPasswordDto,
} from "apps/auth-service/src/dtos/password-reset.dto";

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
    @Req() req,
    @Body() dto: ChangePasswordDto
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return this.authService.changePassword(formattedToken,  dto);
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
}

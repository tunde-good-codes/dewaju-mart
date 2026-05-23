import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  CreateUserDto,
  VerifyOtpDto,
} from "apps/auth-service/src/dtos/create-user-dto";
import type { Response } from "express";

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
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}

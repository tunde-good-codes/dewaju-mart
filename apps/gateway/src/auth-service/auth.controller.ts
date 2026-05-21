import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto, VerifyOtpDto } from "apps/auth-service/src/dtos/create-user-dto";

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
}

import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth-service.service";
import { CreateUserDto, VerifyOtpDto } from "./dtos/create-user-dto";
import { ResponseMessage } from "libs/decorator/response.message.decorator";
import { GoogleAuthGuard } from "./guards/google.auth.guards";

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @Post("register")
  @ResponseMessage("otp sent to the mail provided")
  async registerUser(@Body() dto: CreateUserDto) {
    return this.authService.registerUser(dto);
  }

  @Post("verify")
  @ResponseMessage("user created successfully")
  async verifyOtpRegisterUSer(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpRegisterUser(dto);
  }



  @Get("google")
  @UseGuards(GoogleAuthGuard) // This guard handles the automatic redirection logic instantly
  async googleAuth() {
    // Left empty intentionally: Passport takes care of the redirect!
  }
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ResponseMessage("Google auth operation is successful")
  async googleCallback(@Req() req) {
    return await this.authService.validateGoogleUser(req.user);
  }
}

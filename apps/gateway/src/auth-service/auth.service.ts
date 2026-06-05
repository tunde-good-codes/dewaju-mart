import {
  BadGatewayException,
  Injectable,
  HttpException,
  Logger,
} from "@nestjs/common";
import {
  CreateUserDto,
  VerifyOtpDto,
} from "apps/auth-service/src/dtos/create-user-dto";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { AxiosError } from "axios";
import {
  ChangePasswordDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
} from "apps/auth-service/src/dtos/password-reset.dto";
import { UpdateUserDto } from "apps/auth-service/src/dtos/update-user.dto";
import FormData from "form-data";

@Injectable()
export class AuthService {
  private readonly authServer = `http://localhost:${SERVICES_PORT.AUTH_SERVICE}/api/v1/auth`;
  private readonly logger = new Logger("Gateway:AuthService");

  constructor(private readonly httpService: HttpService) {}

  async registerUser(data: CreateUserDto) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/register`, data)
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async verifyRegisterUser(data: VerifyOtpDto) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/verify`, data)
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async googleUserRegister() {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.authServer}/google/callback`)
      );
      return result.data;
    } catch (e) {
      this.handleAxiosError(e);
    }
  }
  async getGoogleUserRegister() {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.authServer}/google`)
      );
      return result.data;
    } catch (e) {
      this.handleAxiosError(e);
    }
  }

  async getAllUsers(authToken: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.authServer}/users`, {
          headers: {
            Authorization: authToken,
          },
        })
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async forgotPassword(email: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/forgot-password`, email)
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async resetPassword(data: ResetPasswordDto) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/reset-password`, data)
      );
      return await result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async changePassword(token: string, data: ChangePasswordDto) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/change-password`, data, {
          headers: {
            Authorization: token,
          },
        })
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }
  async loginUser(data: { email: string; password: string }) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/login`, data)
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async getAUser(authToken: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.authServer}/user`, {
          headers: {
            Authorization: authToken,
          },
        })
      );

      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async logout(token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(
          `${this.authServer}/logout`,
          {},
          { headers: { Authorization: token } }
        )
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async logoutAll(token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(
          `${this.authServer}/logout-all`,
          {},
          { headers: { Authorization: token } }
        )
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/refresh-token`, dto)
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async updateUserData(token: string, data: UpdateUserDto) {
    try {
      const result = await firstValueFrom(
        this.httpService.patch(`${this.authServer}/me`, data, {
          headers: {
            Authorization: token,
          },
        })
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }
  async updateUserImage(token: string, file: Express.Multer.File) {
    const form = new FormData();
    form.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/me/image`, form, {
          headers: {
            Authorization: token,
            ...form.getHeaders(),
          },
        })
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }
  async resendOtp(dto: ResendOtpDto) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.authServer}/resend-otp`, dto)
      );
      return result.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  private handleAxiosError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      this.logger.error(
        `Auth service error: ${status} — ${JSON.stringify(data)}`
      );
      throw new HttpException(data?.message ?? "Auth service error", status);
    }

    this.logger.error(`Auth service unreachable: ${error.message}`);
    throw new BadGatewayException("Auth service is currently unavailable");
  }
}

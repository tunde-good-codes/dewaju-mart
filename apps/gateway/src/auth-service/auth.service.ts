
import {
  BadGatewayException,
  Injectable,
  HttpException,
  Logger,
} from "@nestjs/common";
import { CreateUserDto, VerifyOtpDto } from "apps/auth-service/src/dtos/create-user-dto";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { AxiosError } from "axios";

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

  private handleAxiosError(error: AxiosError): never {
    if (error.response) {
      // auth-service replied with a 4xx/5xx — forward it exactly as-is
      const status = error.response.status;
      const data = error.response.data as any;
      this.logger.error(`Auth service error: ${status} — ${JSON.stringify(data)}`);
      throw new HttpException(data?.message ?? "Auth service error", status);
    }

    // auth-service was unreachable (network error, service down)
    this.logger.error(`Auth service unreachable: ${error.message}`);
    throw new BadGatewayException("Auth service is currently unavailable");
  }
}
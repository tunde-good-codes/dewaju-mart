import { BadGatewayException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "apps/auth-service/src/dtos/create-user-dto";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class AuthService {
  constructor(
    private readonly authServiceUrl: `http://localhost:3001/api/v1/auth`,
    private readonly httpService: HttpService
  ) {}

  async registerUser(data: CreateUserDto) {
    const result = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/register`, data)
    );
    if (!result) {
      throw new BadGatewayException("Error registering new user");
    }
    return result.data;
  }
}

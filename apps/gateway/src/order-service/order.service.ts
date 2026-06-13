import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { CreateOrderDto } from "apps/order-service/src/dtos/create-order.dto";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { firstValueFrom } from "rxjs";

@Injectable()
export class OrderService {
  private readonly orderServerUrl = `http://localhost:${SERVICES_PORT.ORDER_SERVICE}/api/v1/order`;

  private readonly logger = new Logger("gateway:order");
  constructor(private readonly httpService: HttpService) {}

  async createOrder(dto: CreateOrderDto, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(`${this.orderServerUrl}`, dto, {
          headers: { Authorization: token },
        })
      );
      this.logger.log("order created");
      return result.data;
    } catch (error) {
      const message = error?.message;
      const statusCode = error?.statusCode;

      this.logger.warn("error creating an order");
      throw new BadRequestException({
        error: message,
        statusCode,
        message: "can't create a new order",
      });
    }
  }

  async getMyOrders(token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.orderServerUrl}`, {
          headers: {
            Authorization: token,
          },
        })
      );

      return result.data;
    } catch (error) {
      const message = error?.message;
      const statusCode = error?.statusCode;

      this.logger.warn("error getting my order");
      throw new BadRequestException({
        error: message,
        statusCode,
        message: "can't get my orders",
      });
    }
  }
  async getSingleOrder(id: string, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.orderServerUrl}/${id}`, {
          headers: {
            Authorization: token,
          },
        })
      );

      return result.data;
    } catch (error) {
      const message = error?.message;
      const statusCode = error?.statusCode;

      this.logger.warn("error getting an order");
      throw new BadRequestException({
        error: message,
        statusCode,
        message: "can't get an order with this id: " + id,
      });
    }
  }

  async getMyOrderById(id: string, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.orderServerUrl}/${id}`, {
          headers: {
            Authorization: token,
          },
        })
      );
    } catch (error) {}
  }
}

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
      const statusCode = error?.statusCode;

      this.logger.warn("error creating an order");
      throw new BadRequestException({
        error: error.message,
        statusCode,
        message: "can't create a new order",
        backendError: error?.response?.data
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
        this.httpService.get(`${this.orderServerUrl}/${id}/my-order`, {
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
  async cancelMyOrder(id: string, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.orderServerUrl}/${id}/cancel`, {
          headers: {
            Authorization: token,
          },
        })
      );
      return result.data;
    } catch (error) {
      const message = error?.message;
      const statusCode = error?.statusCode;

      this.logger.warn("error cancelling an order");
      throw new BadRequestException({
        error: message,
        statusCode,
        message: "can't cancel an order with this id: " + id,
      });
    }
  }
  async confirmMyOrder(id: string, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.orderServerUrl}/${id}/confirm-payment`, {
          headers: {
            Authorization: token,
          },
        })
      );
      return result.data;
    } catch (error) {
      this.logger.error(`Order creation failed: ${error.message}`);

      throw new BadRequestException({
        message: "Can't create order",
        code: error.code,
        details: error.response?.data?.message ?? error.message,
      });
    }
  }
  async failedPayment(id: string, token: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`${this.orderServerUrl}/${id}/failed-payment`, {
          headers: {
            Authorization: token,
          },
        })
      );
      return result.data;
    } catch (error) {
      const message = error?.message;
      const statusCode = error?.statusCode;

      this.logger.warn("error cancelling an order");
      throw new BadRequestException({
        error: message,
        statusCode,
        message: "can't cancel an order with this id: " + id,
      });
    }
  }
}

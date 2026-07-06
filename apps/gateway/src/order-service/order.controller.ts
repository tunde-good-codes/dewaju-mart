import { ApiGetService, ApiProtectedDelete, ApiProtectedGetService } from "./../../../../libs/decorator/swagger.decorator";
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "apps/order-service/src/dtos/create-order.dto";
import { ApiTags } from "@nestjs/swagger";
import {
  ApiCreate,
  ApiProtectedGetAll,
  ApiProtectedGetOne,
} from "libs/decorator/swagger.decorator";
@ApiTags("Order Service")
@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new Logger("gateway:order");



  
    @ApiGetService("this service is alive and active")
    @Get("health")
    health() {
      return {
        status: "ok",
        service: "order-service",
        timestamp: new Date().toISOString(),
      };
    }
  @ApiCreate("Create a new order", CreateOrderDto)
  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return this.orderService.createOrder(dto, formattedToken);
  }

  @ApiProtectedGetAll("all orders fetched successfully")
  @Get()
  async getMyOrders(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.getMyOrders(formattedToken);
  }

  @ApiProtectedGetAll("all my orders fetched successfully")
  @Get("all-orders")
  async getAllOrders(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.getAllOrders(formattedToken);
  }

  @ApiProtectedGetOne("my single order fetched successfully")
  @Get(":id/my-order")
  async getMySingleOrderById(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.getMyOrderById(id, formattedToken);
  }

  @ApiProtectedGetOne("a single order fetched successfully")
  @Get(":id")
  async getSingleOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.getSingleOrder(id, formattedToken);
  }

  @ApiProtectedGetService("order cancelled successfully")
  @Get(":id/cancel")
  async cancelMyOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.cancelMyOrder(id, formattedToken);
  }

  @ApiProtectedGetService("order confirmed successfully")
  @Get(":id/confirm-payment")
  async confirmOrderPayment(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.confirmMyOrder(id, formattedToken);
  }

  @ApiProtectedDelete("order deleted successfully")
  @Delete(":id")
  async deleteOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @Headers("authorization") token: string
  ) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.deleteOrder(id, formattedToken);
  }
}

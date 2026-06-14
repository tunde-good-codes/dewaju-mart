import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "apps/order-service/src/dtos/create-order.dto";

@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

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

  @Get()
  async getMyOrders(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.getMyOrders(formattedToken);
  }

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
}

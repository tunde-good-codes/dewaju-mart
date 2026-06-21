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

@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new Logger("gateway:order");

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

  @Get("all-orders")
  async getAllOrders(@Headers("authorization") token: string) {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;

    return await this.orderService.getAllOrders(formattedToken);
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

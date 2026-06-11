import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { OrderService } from "./order-service.service";
import { JwtAuthGuard } from "apps/auth-service/src/guards/jwt-auth.guard";
import { CreateOrderDto } from "./dtos/create-order.dto";
import { ResponseMessage } from "libs/decorator/response.message.decorator";

@Controller()
export class OrderServiceController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getHello(): string {
    return this.orderService.getHello();
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("order created successfully")
  async createOrder(@Body() dto: CreateOrderDto, @Req() req) {
    return this.orderService.createOrder(dto, req.user.id, req.user.email);
  }
}

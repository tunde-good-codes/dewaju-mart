import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
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

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("all your orders fetched successfully")
  async getMyOrders(@Req() req) {
    return this.orderService.getMyOrders(req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("an order  fetched successfully")
  async getSingleOrder(@Req() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.orderService.getOrderById(id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("an order of yours fetched successfully")
  async getMyOrderById(@Req() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.orderService.getMyOneOrderById(req.user.id, id);
  }

  @Get(":id/cancel")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("this order has been cancelled successfully")
  async cancelOrder(@Req() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.orderService.cancelOrder(req.user.id, id);
  }
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("this order has been payment confirmed successfully")
  async handlePaymentConfirmed(
    @Req() req,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.orderService.handlePaymentConfirmed(id);
  }
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("this order has been payment confirmed successfully")
  async handleFailedConfirmed(
    @Req() req,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.orderService.handleFailedPayment(id);
  }
}

import { Controller, Get } from '@nestjs/common';
import { OrderService } from './order-service.service';

@Controller()
export class OrderServiceController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getHello(): string {
    return this.orderService.getHello();
  }
}

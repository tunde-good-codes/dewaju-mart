import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import type { RawBodyRequest } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Request } from "express";
import { KAFKA_TOPICS } from "@app/kafka";
import { PaymentService } from "./payment-service.service";

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern(KAFKA_TOPICS.ORDER_CREATED)
  async onOrderCreated(
    @Payload()
    payload: {
      orderId: string;
      buyerId: string;
      email: string;
      totalAmount: number;
    }
  ) {
    await this.paymentService.handleOrderCreated(payload);
  }

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("x-paystack-signature") signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException("Missing webhook signature");
    }

    const rawBody = req.rawBody?.toString();

    if (!rawBody) {
      throw new BadRequestException("Empty webhook body");
    }

    return this.paymentService.handleWebhook(rawBody, signature);
  }
}

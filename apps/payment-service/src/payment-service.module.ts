import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";

import { DatabaseModule } from "@app/database";
import { KafkaModule } from "@app/kafka";

import { PaystackService } from "./paystack.service";
import { Payment } from "./entities/payment.entity";
import {
  PaymentService,
  VERIFY_PAYMENT_QUEUE,
} from "./payment-service.service";
import { PaymentController } from "./payment-service.controller";
import { VerifyPaymentProcessor } from "./verify-payment.queue";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `apps/payment-service/.env.${
        process.env.NODE_ENV || "development"
      }`,
    }),
    DatabaseModule,
    HttpModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 600000,
    }),
    TypeOrmModule.forFeature([Payment]),
    KafkaModule.register("payment-service-group"),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT) ?? 6379,
      },
    }),
    BullModule.registerQueue({
      name: VERIFY_PAYMENT_QUEUE,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaystackService, VerifyPaymentProcessor],
})
export class PaymentServiceModule {}

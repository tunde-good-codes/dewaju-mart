import { Module } from "@nestjs/common";
import { OrderServiceController } from "./order-service.controller";
import { OrderServiceService } from "./order-service.service";
import { ConfigModule } from "@nestjs/config";
import { KafkaModule } from "@app/kafka";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: `apps/order-service/.env.${
        process.env.NODE_ENV || "development"
      }`,
    }),

    KafkaModule.register("order-service-group"),
  ],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
})
export class OrderServiceModule {}

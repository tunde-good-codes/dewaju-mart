import { Inject, Module } from "@nestjs/common";
import { OrderServiceController } from "./order-service.controller";
import { OrderService } from "./order-service.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { KafkaModule } from "@app/kafka";
import { DatabaseModule } from "@app/database";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order.item.entity";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategies";
import { Passport } from "passport";
import { PassportModule } from "@nestjs/passport";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: `apps/order-service/.env.${
        process.env.NODE_ENV || "development"
      }`,
    }),

    KafkaModule.register("order-service-group"),
    HttpModule,
    DatabaseModule,
    PassportModule.register({
      defaultStrategy: "jwt",
    }),
    TypeOrmModule.forFeature([Order, OrderItem]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.getOrThrow<number>("JWT_EXPIRES_IN"),
        },
      }),
    }),
  ],
  controllers: [OrderServiceController],
  providers: [OrderService, JwtStrategy],
})
export class OrderServiceModule {}

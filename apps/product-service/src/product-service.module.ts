import { KafkaModule } from "./../../../libs/kafka/src/kafka.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { DatabaseModule } from "@app/database";

import { ProductServiceController } from "./product-service.controller";
import { ProductService } from "./product-service.service";

import { Category } from "./entities/categories.entities";
import { Product } from "./entities/product.entities";
import { JwtStrategy } from "../jwt.strategies";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `apps/product-service/.env.${
        process.env.NODE_ENV || "development"
      }`,
    }),

    DatabaseModule,

    TypeOrmModule.forFeature([Category, Product]),

    PassportModule.register({
      defaultStrategy: "jwt",
    }),
    KafkaModule.register("product-service-group"),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.getOrThrow<number>("JWT_EXPIRES_IN"),
        },
      }),
    }),
  ],
  controllers: [ProductServiceController],

  providers: [ProductService, JwtStrategy],
  exports:[ProductService]
})
export class ProductServiceModule {}

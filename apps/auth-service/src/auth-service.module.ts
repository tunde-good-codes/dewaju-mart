import { Module } from "@nestjs/common";
import { AuthServiceController } from "./auth-service.controller";
import { AuthService } from "./auth-service.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DatabaseModule } from "@app/database";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { JwtModule } from "@nestjs/jwt";
import { KafkaModule } from "@app/kafka";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/User";
import { GoogleStrategy } from "./strategies/google.strategy";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { JwtStrategy } from "./strategies/jwtStrategy";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `apps/auth-service/.env.${process.env.NODE_ENV || "development"}`,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 120000,
        limit: 5,
      },
    ]),
    PassportModule.register({}),
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    KafkaModule.register("auth-service-group"),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.getOrThrow<string>("REDIS_HOST"),
            port: configService.getOrThrow<number>("REDIS_PORT"),
          },
        }),
      }),
    }),

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
  controllers: [AuthServiceController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [JwtStrategy, JwtModule],
})
export class AuthServiceModule {}

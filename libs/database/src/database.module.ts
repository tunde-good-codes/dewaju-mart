import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { dataBaseConfig } from "./database.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger("TypeORM Postgres DB");

        const config = dataBaseConfig();

        if (config.type === "postgres") {
          logger.log(
            `🚀 Database connected: running [${config.database}] on port [${config.port}]`
          );
        }
        return config;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

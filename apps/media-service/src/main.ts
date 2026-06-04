import { NestFactory } from "@nestjs/core";
import { MediaModule } from "./media-service.module";
import { Logger } from "@nestjs/common";
import { Transport } from "@nestjs/microservices";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { configureGlobalSettings } from "libs/bootstrap.util";

async function bootstrap() {
  process.title = "media-service";

  const logger = new Logger("media-service-logs");
  const app = await NestFactory.create(MediaModule);

  app.enableShutdownHooks();
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      clients: {
        brokers: ["localhost:9092"],
      },
      consumer: {
        groupId: "product-service-group",
      },
    },
  });

  app.startAllMicroservices();
  configureGlobalSettings(app, {
    serviceName: "media-service",
    prefix: "api/v1/media",
  });
  await app.listen(SERVICES_PORT.MEDIA_SERVICE);

  logger.log("connected to media service");
}
bootstrap();

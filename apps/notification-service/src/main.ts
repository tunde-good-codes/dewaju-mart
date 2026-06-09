import { NestFactory } from "@nestjs/core";
import { NotificationServiceModule } from "./notification-service.module";
import { Logger } from "@nestjs/common";
import { configureGlobalSettings } from "libs/bootstrap.util";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { Transport } from "@nestjs/microservices";
import { KAFKA_BROKER } from "@app/kafka";

async function bootstrap() {
  process.title = "notification server";
  const logger = new Logger("notification server running");
  const app = await NestFactory.create(NotificationServiceModule);
  app.enableShutdownHooks();

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
      brokers: [KAFKA_BROKER],
      },
      consumer: {
        groupId: "notification-service-group",
      },
    },
  });
    app.startAllMicroservices();

  configureGlobalSettings(app, {
    serviceName: "notification server",
    prefix: "api/v1/notification",
  });
  await app.listen(SERVICES_PORT.NOTIFICATION_SERVICE ?? 3002);
  logger.log(
    `notification server running on port: ${SERVICES_PORT.NOTIFICATION_SERVICE} `
  );
}
bootstrap();

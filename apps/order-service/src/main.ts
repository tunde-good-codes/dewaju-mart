import { NestFactory } from "@nestjs/core";
import { OrderServiceModule } from "./order-service.module";
import { Logger } from "@nestjs/common";
import { Transport } from "@nestjs/microservices";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { configureGlobalSettings } from "libs/bootstrap.util";

async function bootstrap() {
  process.title = "order-service-group";

  const logger = new Logger("order-service-group");

  const app = await NestFactory.create(OrderServiceModule);

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER],
      },
      consumer: {
        groupId: "order-service-group",
      },
    },
  });

  app.startAllMicroservices();

  app.enableShutdownHooks();

  configureGlobalSettings(app, {
    serviceName: "order-service",
    prefix: "api/v1/order",
  });
  await app.listen(SERVICES_PORT.ORDER_SERVICE);
  logger.log(
    `order service running and connected on port: ${SERVICES_PORT.ORDER_SERVICE}`
  );
}
bootstrap();

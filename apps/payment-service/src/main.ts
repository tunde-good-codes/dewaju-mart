import { KAFKA_BROKER } from './../../../libs/kafka/src/kafka.topics';
import { NestFactory } from "@nestjs/core";
import { PaymentServiceModule } from "./payment-service.module";
import { Logger } from "@nestjs/common";
import { Transport } from "@nestjs/microservices";
import { configureGlobalSettings } from "libs/bootstrap.util";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";

async function bootstrap() {
  process.title = "payment-service";

  const logger = new Logger();

  const app = await NestFactory.create(PaymentServiceModule);
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER],
      },
      consumer: {
        groupId: "payment-service-group",
      },
    },
  });

  app.startAllMicroservices();
  app.enableShutdownHooks();
  configureGlobalSettings(app, {
    serviceName: "payment-service",
    prefix: "api/v1/payment",
  });
  await app.listen(SERVICES_PORT.PAYMENT_SERVICE);

  logger.log("payment service running and connected on port:3006")
}
bootstrap();

import { NestFactory } from "@nestjs/core";
import { GatewayModule } from "./gateway.module";
import { Logger } from "@nestjs/common";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";

async function bootstrap() {
  process.title = "gateway.module"

  const logger = new Logger("Gateway service logs")
  const app = await NestFactory.create(GatewayModule);

  app.enableShutdownHooks()
  await app.listen(SERVICES_PORT.GATEWAY_SERVICE ?? 3000);
  logger.log("gateway service is running")
}
bootstrap();

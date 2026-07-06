import { NestFactory } from "@nestjs/core";
import { GatewayModule } from "./gateway.module";
import { Logger } from "@nestjs/common";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { setupGatewaySwagger } from "./swagger.setup";
import { configureGlobalSettings } from "libs/bootstrap.util";

async function bootstrap() {
  process.title = "gateway.module"

  const logger = new Logger("Gateway service logs")
  const app = await NestFactory.create(GatewayModule);

  
  app.enableShutdownHooks()

    configureGlobalSettings(app, {
    serviceName: "gateway server",
    prefix: "api/v1",
  });

  setupGatewaySwagger(app);

  await app.listen(SERVICES_PORT.GATEWAY_SERVICE ?? 3000);
  logger.log(`gateway service is running on port: ${SERVICES_PORT.GATEWAY_SERVICE} `)
}
bootstrap();

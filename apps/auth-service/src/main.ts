import { NestFactory } from "@nestjs/core";
import { AuthServiceModule } from "./auth-service.module";
import { Logger } from "@nestjs/common";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { configureGlobalSettings } from "libs/bootstrap.util";

async function bootstrap() {
  process.title = "auth-service";

  const logger = new Logger("auth service group");
  const app = await NestFactory.create(AuthServiceModule);

  app.startAllMicroservices();
  app.enableShutdownHooks();

  configureGlobalSettings(app, {
    serviceName: "Auth Service",
    prefix: "api/v1/auth",
  });
  await app.listen(SERVICES_PORT.AUTH_SERVICE);

  logger.log(`auth service is running on port: ${SERVICES_PORT.AUTH_SERVICE}`);
}
bootstrap();

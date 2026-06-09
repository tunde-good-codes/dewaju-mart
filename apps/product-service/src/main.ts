import { NestFactory } from '@nestjs/core';
import { ProductServiceModule } from './product-service.module';
import { Logger } from "@nestjs/common";
import { configureGlobalSettings } from "libs/bootstrap.util";
import { SERVICES_PORT } from "libs/shared/constants/services.constant";
import { Transport } from "@nestjs/microservices";
import { KAFKA_BROKER } from "@app/kafka";

async function bootstrap() {
  process.title = "product service group"

  const logger = new Logger("product-service")


  const app = await NestFactory.create(ProductServiceModule);


  app.connectMicroservice({
    transport:Transport.KAFKA, options:{
      client:{
        brokers:[KAFKA_BROKER]
      },
      consumer:{
        groupId:"product-service-group"
      }
    }
  })
  app.startAllMicroservices()
  app.enableShutdownHooks()


  configureGlobalSettings(app,{
    serviceName:"product-service", 
    prefix:"api/v1/products"
  })
  await app.listen(SERVICES_PORT.PRODUCT_SERVICE ?? 3003);
  logger.log(`product service is running on port: ${SERVICES_PORT.PRODUCT_SERVICE}`)
}
bootstrap();

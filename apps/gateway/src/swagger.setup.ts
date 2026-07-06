import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupGatewaySwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Dewaju API")
    .setDescription(
      `
# Dewaju Mart Nestjs Microservice System

This documentation covers all publicly accessible HTTP endpoints exposed through the API Gateway.

## Public Services
- Authentication Service
- Product Service
- Order Service

## Internal Services (Kafka-based)
These services do not expose HTTP endpoints and communicate asynchronously through Kafka.

- Payment Service
- Notification Service
- Media Service

These services are triggered by events emitted from other services and are not directly accessible by API consumers.
`
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/v1/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });
}

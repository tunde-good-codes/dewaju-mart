import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { ResponseInterceptor } from "./interceptor/response.interceptor";


interface BootstrapOptions {
  serviceName: string;
  version?: string;
  prefix?: string;
}

export function configureGlobalSettings(
  app: INestApplication,
  options: BootstrapOptions,
) {
  const prefix = options.prefix ?? 'api/v1';

  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 🔥 3. Global Interceptor Setup
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  // 4. Swagger
  const config = new DocumentBuilder()
    .setTitle(`${options.serviceName} API`)
    .setDescription(`The API documentation for ${options.serviceName}`)
    .setVersion(options.version ?? '1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document);
}
import { NestFactory } from '@nestjs/core';
import { MediaServiceModule } from './media-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MediaServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();

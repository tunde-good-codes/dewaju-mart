import { Module } from '@nestjs/common';
import { MediaServiceController } from './media-service.controller';
import { MediaServiceService } from './media-service.service';

@Module({
  imports: [],
  controllers: [MediaServiceController],
  providers: [MediaServiceService],
})
export class MediaServiceModule {}

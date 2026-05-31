import { Controller, Get } from '@nestjs/common';
import { MediaServiceService } from './media-service.service';

@Controller()
export class MediaServiceController {
  constructor(private readonly mediaServiceService: MediaServiceService) {}

  @Get()
  getHello(): string {
    return this.mediaServiceService.getHello();
  }
}

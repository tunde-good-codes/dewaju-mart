import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}

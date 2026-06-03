import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from "./media-service.controller";
import { MediaService } from "./media-service.service";
import { CloudinaryService } from "./cloudinary.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [MediaController],
  providers: [MediaService, CloudinaryService],
})
export class MediaModule {}
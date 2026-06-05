import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>('CLOUDINARY_NAME'),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
    this.logger.log('Cloudinary configured successfully');
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    options?: { publicId?: string; transformation?: object },
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: options?.publicId,
          transformation: options?.transformation ?? [
            { quality: 'auto', fetch_format: 'auto' },
          ],
          resource_type: 'auto',
        },
        (error, result:UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async deleteByPublicId(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
    this.logger.log(`Deleted Cloudinary asset: ${publicId}`);
  }

  async deleteManyByPublicIds(publicIds: string[]): Promise<void> {
    if (!publicIds.length) return;
    await cloudinary.api.delete_resources(publicIds);
    this.logger.log(`Deleted ${publicIds.length} Cloudinary assets`);
  }
}
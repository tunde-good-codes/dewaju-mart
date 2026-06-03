
import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from "./cloudinary.service";
import { UploadSinglePayload, 
  UploadMultiplePayload,
  DeleteMediaPayload,
  UploadSingleResult,
  UploadMultipleResult, } from "./media.types";


@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadSingle(payload: UploadSinglePayload): Promise<UploadSingleResult> {
    try {
      this.logger.log(
        `Uploading single file [${payload.originalName}] to folder [${payload.folder}]`,
      );

      const buffer = Buffer.from(payload.buffer, 'base64');
      const result = await this.cloudinaryService.uploadBuffer(buffer, payload.folder);

      this.logger.log(`Upload success: ${result.secure_url}`);

      return {
        correlationId: payload.correlationId,
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      return {
        correlationId: payload.correlationId,
        success: false,
        error: error.message,
      };
    }
  }

  async uploadMultiple(payload: UploadMultiplePayload): Promise<UploadMultipleResult> {
    try {
      const { files, folder, maxCount, correlationId } = payload;

      if (files.length > maxCount) {
        return {
          correlationId,
          success: false,
          error: `Too many files. Maximum allowed is ${maxCount}.`,
        };
      }

      this.logger.log(`Uploading ${files.length} files to folder [${folder}]`);

      const uploadPromises = files.map((file) => {
        const buffer = Buffer.from(file.buffer, 'base64');
        return this.cloudinaryService.uploadBuffer(buffer, folder);
      });

      const results = await Promise.all(uploadPromises);

      const urls = results.map((r) => r.secure_url);
      const publicIds = results.map((r) => r.public_id);

      this.logger.log(`Uploaded ${urls.length} files successfully`);

      return {
        correlationId,
        success: true,
        urls,
        publicIds,
      };
    } catch (error) {
      this.logger.error(`Multiple upload failed: ${error.message}`, error.stack);
      return {
        correlationId: payload.correlationId,
        success: false,
        error: error.message,
      };
    }
  }

  async deleteMedia(payload: DeleteMediaPayload): Promise<void> {
    try {
      await this.cloudinaryService.deleteManyByPublicIds(payload.publicIds);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`, error.stack);
    }
  }
}
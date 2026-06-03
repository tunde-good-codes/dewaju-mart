import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Payload, EventPattern } from "@nestjs/microservices";
import { MediaService } from "./media-service.service";
import type{
  UploadSinglePayload,
  UploadMultiplePayload,
  DeleteMediaPayload,
} from "./media.types";
import { KAFKA_TOPICS } from "@app/kafka";

@Controller()
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  /**
   * RPC — caller awaits the reply.
   * Used by user-service (avatar upload) and product-service (product images).
   */
  @MessagePattern(KAFKA_TOPICS.UPLOAD_SINGLE_USER_IMAGE)
  async handleUploadSingle(@Payload() payload: UploadSinglePayload) {
    this.logger.log(
      `Received single upload request [correlationId: ${payload.correlationId}]`
    );
    return this.mediaService.uploadSingle(payload);
  }

  /**
   * RPC — caller awaits the reply.
   * Used by product-service during product creation (up to 4 images).
   */
  @MessagePattern(KAFKA_TOPICS.UPLOAD_MULTIPLE_IMAGE)
  async handleUploadMultiple(@Payload() payload: UploadMultiplePayload) {
    this.logger.log(
      `Received multiple upload request [correlationId: ${payload.correlationId}] — ${payload.files.length} file(s)`
    );
    return this.mediaService.uploadMultiple(payload);
  }

  /**
   * Fire-and-forget — no reply needed.
   * Used when replacing images (old public IDs must be cleaned from Cloudinary).
   */
  @EventPattern(KAFKA_TOPICS.MEDIA_DELETE)
  async handleDelete(@Payload() payload: DeleteMediaPayload) {
    this.logger.log(
      `Received delete request for ${payload.publicIds.length} asset(s)`
    );
    await this.mediaService.deleteMedia(payload);
  }
}

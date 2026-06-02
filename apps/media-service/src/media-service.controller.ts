import {
  Controller,
  Post,
  Delete,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { MediaService } from "./media-service.service";
import { multerConfig } from "./multer.config";

@Controller("media")
export class MediaServiceController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload/single")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body("subfolder") subfolder: string = "general"
  ) {
    if (!file) throw new BadRequestException("No file provided");
    return this.mediaService.uploadSingle(file, subfolder);
  }

  @Post("upload/multiple")
  @UseInterceptors(FilesInterceptor("files", 4, multerConfig))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body("subfolder") subfolder: string = "general"
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }
    return this.mediaService.uploadMultiple(files, subfolder);
  }

  // Delete image by url
  @Delete("delete")
  async deleteImage(@Body("imageUrl") imageUrl: string) {
    if (!imageUrl) throw new BadRequestException("imageUrl is required");
    return this.mediaService.deleteImage(imageUrl);
  }
}
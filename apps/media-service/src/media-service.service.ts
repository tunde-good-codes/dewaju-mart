
import { Injectable } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";

@Injectable()
export class MediaService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadSingle(file: Express.Multer.File, subfolder: string) {
    const imageUrl = await this.cloudinaryService.uploadFile(file, subfolder);
    return { imageUrl };
  }

  async uploadMultiple(files: Express.Multer.File[], subfolder: string) {
    const imageUrls = await this.cloudinaryService.uploadFiles(files, subfolder);
    return { imageUrls };
  }

  async deleteImage(imageUrl: string) {
    await this.cloudinaryService.deleteFile(imageUrl);
    return { message: "Image deleted successfully" };
  }
}
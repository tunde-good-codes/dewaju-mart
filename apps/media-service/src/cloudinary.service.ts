import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import * as streamifier from "streamifier";
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger("media-service");
  private readonly folder: string;

  constructor(private readonly configService: ConfigService) {
    this.folder = this.configService.getOrThrow<string>("CLOUDINARY_FOLDER");
  }

  async uploadFile(file: Express.Multer.File, subFolder: string) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.folder}/${subFolder}`,
          resource_type: "auto",
        },

        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`cloudinary upload failed. ${error.message}`);

            return reject(
              new BadRequestException("Image upload to cloudinary failed")
            );
          }
          resolve(result.secure_url);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }


    async uploadFiles(
    files: Express.Multer.File[],
    subfolder: string
  ) {
    if (files.length > 4) {
      throw new BadRequestException("Maximum of 4 images allowed per product");
    }

    const uploads = files.map((file) => this.uploadFile(file, subfolder));
    return Promise.all(uploads); 
  }

  async deleteFile(imageUrl: string): Promise<void> {
    try {
      const splits = imageUrl.split("/");
      const filename = splits[splits.length - 1].split(".")[0];
      const folder = splits[splits.length - 2];
      const publicId = `${this.folder}/${folder}/${filename}`;

      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted image: ${publicId}`);
    } catch (error) {
      this.logger.error(`Failed to delete image: ${error.message}`);
    }
  }
}


export interface UploadSinglePayload {
  buffer: string; 
  mimetype: string;
  originalName: string;
  folder: string;
  correlationId: string;
}

export interface UploadMultiplePayload {
  files: Array<{
    buffer: string; // base64 encoded
    mimetype: string;
    originalName: string;
  }>;
  folder: string;
  maxCount: number;
  correlationId: string;
}

export interface DeleteMediaPayload {
  publicIds: string[];
}

export interface UploadSingleResult {
  correlationId: string;
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface UploadMultipleResult {
  correlationId: string;
  success: boolean;
  urls?: string[];
  publicIds?: string[];
  error?: string;
}

export const MEDIA_FOLDERS = {
  USER_AVATARS: "users/avatars",
  PRODUCT_IMAGES: "products/images",
  CATEGORY_IMAGES: "categories/images",
} as const;

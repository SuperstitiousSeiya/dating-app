import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTOS_PER_PROFILE = 6;

export const UploadPhotoSchema = z.object({
  order: z.coerce.number().int().min(0).max(5),
});

export const ReorderPhotosSchema = z.object({
  photoIds: z
    .array(z.string())
    .min(1)
    .max(MAX_PHOTOS_PER_PROFILE),
});

export type UploadPhotoDto = z.infer<typeof UploadPhotoSchema>;
export type ReorderPhotosDto = z.infer<typeof ReorderPhotosSchema>;

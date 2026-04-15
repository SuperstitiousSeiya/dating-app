import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import type { UploadApiResponse } from "cloudinary";
import type { Model } from "mongoose";
import type { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

import { MAX_PHOTOS_PER_PROFILE } from "@dating-app/validators";

import { Profile, type ProfileDocument } from "../profiles/schemas/profile.schema";

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("app.cloudinary.cloudName"),
      api_key: this.configService.get<string>("app.cloudinary.apiKey"),
      api_secret: this.configService.get<string>("app.cloudinary.apiSecret"),
    });
  }

  /**
   * Uploads a photo to Cloudinary and appends it to the user's profile photos.
   * @throws BadRequestException if the profile already has 6 photos.
   */
  async uploadPhoto(
    userId: string,
    fileStream: Readable,
    order: number,
  ): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) throw new NotFoundException({ code: "PROFILE_NOT_FOUND", message: "Profile not found" });

    if (profile.photos.length >= MAX_PHOTOS_PER_PROFILE) {
      throw new BadRequestException({
        code: "MAX_PHOTOS_REACHED",
        message: `Maximum ${MAX_PHOTOS_PER_PROFILE} photos allowed`,
      });
    }

    const result = await this.cloudinaryUpload(fileStream, userId);

    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          photos: {
            cloudinaryId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            order,
          },
        },
      },
      { new: true },
    );

    return updatedProfile!;
  }

  /**
   * Deletes a photo from Cloudinary and removes it from the profile.
   */
  async deletePhoto(userId: string, photoId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) throw new NotFoundException({ code: "PROFILE_NOT_FOUND", message: "Profile not found" });

    const photo = profile.photos.find((p) => p._id?.toString() === photoId);
    if (!photo) throw new NotFoundException({ code: "PHOTO_NOT_FOUND", message: "Photo not found" });

    await cloudinary.uploader.destroy(photo.cloudinaryId);

    const updated = await this.profileModel.findOneAndUpdate(
      { userId },
      { $pull: { photos: { _id: photoId } } },
      { new: true },
    );

    return updated!;
  }

  private cloudinaryUpload(stream: Readable, userId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `dating-app/${userId}`,
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: 85, fetch_format: "webp" },
          ],
          moderation: "aws_rek",
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result);
        },
      );
      stream.pipe(uploadStream);
    });
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Model } from "mongoose";

import type { CreateProfileDto, UpdateProfileDto, UpdatePreferencesDto } from "@dating-app/validators";

import { RedisKeys, RedisTTL } from "../../lib/redis-keys";
import { RedisService } from "../../redis/redis.service";
import { Profile, type ProfileDocument } from "./schemas/profile.schema";

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a profile for a user. Throws if profile already exists.
   */
  async create(userId: string, dto: CreateProfileDto): Promise<ProfileDocument> {
    const exists = await this.profileModel.exists({ userId });
    if (exists) {
      throw new ConflictException({ code: "PROFILE_EXISTS", message: "Profile already created" });
    }

    const profile = await this.profileModel.create({
      userId,
      ...dto,
      birthDate: new Date(dto.birthDate),
      preferences: dto.preferences ?? {
        ageRange: { min: 18, max: 35 },
        maxDistanceKm: 50,
        genders: dto.interestedIn,
        intent: "unsure",
      },
    });

    this.eventEmitter.emit("profile.created", { userId, profileId: profile.id });
    return profile;
  }

  async findByUserId(userId: string): Promise<ProfileDocument | null> {
    return this.profileModel.findOne({ userId });
  }

  async findByUserIdOrThrow(userId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) {
      throw new NotFoundException({ code: "PROFILE_NOT_FOUND", message: "Profile not found. Please complete onboarding." });
    }
    return profile;
  }

  async findByIdOrThrow(profileId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException({ code: "PROFILE_NOT_FOUND", message: "Profile not found" });
    }
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOneAndUpdate(
      { userId },
      { $set: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined } },
      { new: true, runValidators: true },
    );
    if (!profile) {
      throw new NotFoundException({ code: "PROFILE_NOT_FOUND", message: "Profile not found" });
    }
    await this.redisService.del(RedisKeys.profile(userId));
    return profile;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOneAndUpdate(
      { userId },
      { $set: { preferences: dto } },
      { new: true },
    );
    if (!profile) throw new NotFoundException({ code: "PROFILE_NOT_FOUND", message: "Profile not found" });
    await this.redisService.del(RedisKeys.feed(userId));
    return profile;
  }

  async touchLastActive(userId: string): Promise<void> {
    await this.profileModel.findOneAndUpdate({ userId }, { $set: { lastActive: new Date() } });
  }

  /**
   * Returns a cached public profile or fetches and caches it.
   */
  async getPublicProfile(targetUserId: string): Promise<ProfileDocument | null> {
    const cached = await this.redisService.getJson<ProfileDocument>(RedisKeys.profile(targetUserId));
    if (cached) return cached;

    const profile = await this.profileModel.findOne({ userId: targetUserId });
    if (profile) {
      await this.redisService.setJson(RedisKeys.profile(targetUserId), profile.toObject(), RedisTTL.PROFILE);
    }
    return profile;
  }
}

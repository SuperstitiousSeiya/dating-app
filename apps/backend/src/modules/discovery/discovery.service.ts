import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import { shuffleArray } from "@dating-app/utils";

import { buildGeoNearStage, kmToMeters } from "../../lib/geo";
import { RedisKeys, RedisTTL } from "../../lib/redis-keys";
import { RedisService } from "../../redis/redis.service";
import { Profile, type ProfileDocument } from "../profiles/schemas/profile.schema";
import { ProfilesService } from "../profiles/profiles.service";
import { SwipesService } from "../swipes/swipes.service";

const CANDIDATE_BATCH_SIZE = 200;
const FEED_PAGE_SIZE = 10;

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>,
    private readonly profilesService: ProfilesService,
    private readonly swipesService: SwipesService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Returns a ranked discovery deck for the given user.
   * Checks Redis cache first; builds and caches if stale.
   */
  async getFeed(userId: string): Promise<ProfileDocument[]> {
    const cached = await this.redisService.getJson<ProfileDocument[]>(RedisKeys.feed(userId));
    if (cached && cached.length > 0) return cached;

    const myProfile = await this.profilesService.findByUserIdOrThrow(userId);
    const prefs = myProfile.preferences;
    const [lng, lat] = myProfile.location.coordinates;

    const alreadySwiped = await this.swipesService.getSwipedTargetIds(userId);

    const maxAgeDate = new Date();
    maxAgeDate.setFullYear(maxAgeDate.getFullYear() - prefs.ageRange.min);
    const minAgeDate = new Date();
    minAgeDate.setFullYear(minAgeDate.getFullYear() - prefs.ageRange.max);

    // Phase 1: Hard geo + preference filter via aggregation
    const candidates = await this.profileModel.aggregate<ProfileDocument & { distanceMeters: number }>([
      buildGeoNearStage(lng, lat, kmToMeters(prefs.maxDistanceKm)),
      {
        $match: {
          "userId": { $ne: myProfile.userId, $nin: [...alreadySwiped].map((id) => new (require("mongoose").Types.ObjectId)(id)) },
          gender: { $in: prefs.genders },
          birthDate: { $gte: minAgeDate, $lte: maxAgeDate },
        },
      },
      { $limit: CANDIDATE_BATCH_SIZE },
    ]);

    // Phase 2: Soft ranking
    const ranked = this.rankCandidates(candidates);
    const feed = ranked.slice(0, FEED_PAGE_SIZE * 2); // Cache 2 pages

    await this.redisService.setJson(RedisKeys.feed(userId), feed, RedisTTL.FEED);
    return feed.slice(0, FEED_PAGE_SIZE);
  }

  /**
   * Soft-ranks candidates:
   * 1. Recently active (within 24h) — high priority
   * 2. Verified profiles — medium boost
   * 3. Randomize within each tier to prevent determinism
   */
  private rankCandidates(
    candidates: Array<ProfileDocument & { distanceMeters: number }>,
  ): ProfileDocument[] {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const tier1: ProfileDocument[] = []; // active < 24h
    const tier2: ProfileDocument[] = []; // active < 7 days
    const tier3: ProfileDocument[] = []; // rest

    for (const c of candidates) {
      const lastActive = new Date(c.lastActive).getTime();
      if (now - lastActive < DAY_MS) tier1.push(c);
      else if (now - lastActive < 7 * DAY_MS) tier2.push(c);
      else tier3.push(c);
    }

    return [
      ...shuffleArray(tier1),
      ...shuffleArray(tier2),
      ...shuffleArray(tier3),
    ];
  }
}

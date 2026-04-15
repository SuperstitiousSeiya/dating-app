import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectModel } from "@nestjs/mongoose";
import type { Model, Types } from "mongoose";

import type { CreateSwipeDto } from "@dating-app/validators";
import { addDays } from "@dating-app/utils";

import { RedisKeys } from "../../lib/redis-keys";
import { RedisService } from "../../redis/redis.service";
import { Swipe, type SwipeDocument } from "./schemas/swipe.schema";

const PASS_EXPIRY_DAYS = 30;

@Injectable()
export class SwipesService {
  constructor(
    @InjectModel(Swipe.name) private readonly swipeModel: Model<SwipeDocument>,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Records a swipe action. If the action results in a mutual like, emits `swipe.matched`.
   */
  async swipe(actorId: string, dto: CreateSwipeDto): Promise<{ isMatch: boolean }> {
    const expiresAt = dto.action === "pass" ? addDays(new Date(), PASS_EXPIRY_DAYS) : null;

    await this.swipeModel.findOneAndUpdate(
      { actorId, targetId: dto.targetId },
      { $set: { action: dto.action, expiresAt } },
      { upsert: true },
    );

    // Invalidate the feed cache for this user
    await this.redisService.del(RedisKeys.feed(actorId));

    if (dto.action === "pass") return { isMatch: false };

    // Check for mutual like
    const theirSwipe = await this.swipeModel.findOne({
      actorId: dto.targetId,
      targetId: actorId,
      action: { $in: ["like", "superlike"] },
    });

    if (theirSwipe) {
      this.eventEmitter.emit("swipe.matched", {
        userAId: actorId,
        userBId: dto.targetId,
        isSuperlike: dto.action === "superlike" || theirSwipe.action === "superlike",
        initiatedBy: actorId,
      });
      return { isMatch: true };
    }

    return { isMatch: false };
  }

  /**
   * Returns a Set of user IDs that the actor has already swiped on.
   * Used to exclude them from the discovery feed.
   */
  async getSwipedTargetIds(actorId: string): Promise<Set<string>> {
    const swipes = await this.swipeModel
      .find({ actorId })
      .select("targetId")
      .lean();
    return new Set(swipes.map((s) => (s.targetId as Types.ObjectId).toString()));
  }
}

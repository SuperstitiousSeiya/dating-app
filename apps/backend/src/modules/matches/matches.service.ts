import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InjectModel } from "@nestjs/mongoose";
import type { ClientSession, Model } from "mongoose";
import mongoose from "mongoose";

import { buildCursorPage } from "@dating-app/utils";

import { RedisKeys, RedisTTL } from "../../lib/redis-keys";
import { RedisService } from "../../redis/redis.service";
import { ProfilesService } from "../profiles/profiles.service";
import { Match, type MatchDocument } from "./schemas/match.schema";

type MatchedEvent = {
  userAId: string;
  userBId: string;
  isSuperlike: boolean;
  initiatedBy: string;
};

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
    private readonly redisService: RedisService,
    private readonly profilesService: ProfilesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Handles the swipe.matched event emitted by SwipesService.
   * Creates a match document atomically and notifies both users.
   */
  @OnEvent("swipe.matched")
  async handleMatchCreated(event: MatchedEvent): Promise<void> {
    const session: ClientSession = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const match = await this.matchModel.create(
          [
            {
              participants: [event.userAId, event.userBId],
              initiatedBy: event.initiatedBy,
              isSuperlike: event.isSuperlike,
            },
          ],
          { session },
        );

        // Increment match counts on both profiles atomically
        const { Profile } = await import("../profiles/schemas/profile.schema");
        const profileModel = this.matchModel.db.model(Profile.name);
        await profileModel.updateMany(
          { userId: { $in: [event.userAId, event.userBId] } },
          { $inc: { "stats.matchCount": 1 } },
          { session },
        );

        await this.redisService.del(
          RedisKeys.matchList(event.userAId),
          RedisKeys.matchList(event.userBId),
        );

        const [profileA, profileB] = await Promise.all([
          this.profilesService.getPublicProfile(event.userAId),
          this.profilesService.getPublicProfile(event.userBId),
        ]);

        this.eventEmitter.emit("match.created", {
          match: match[0],
          userAId: event.userAId,
          userBId: event.userBId,
          profileA,
          profileB,
        });
      });
    } finally {
      await session.endSession();
    }
  }

  async getUserMatches(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ items: MatchDocument[]; nextCursor: string | null; hasNextPage: boolean }> {
    const query = {
      participants: userId,
      status: "active",
      ...(cursor ? { lastMessageAt: { $lt: cursor } } : {}),
    };

    const docs = await this.matchModel
      .find(query)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(limit + 1)
      .lean<MatchDocument[]>();

    return buildCursorPage(docs, limit, (m) => m.lastMessageAt?.toISOString() ?? m.createdAt.toISOString());
  }

  async getMatchById(matchId: string, userId: string): Promise<MatchDocument> {
    const match = await this.matchModel.findById(matchId);
    if (!match) throw new NotFoundException({ code: "MATCH_NOT_FOUND", message: "Match not found" });
    if (!match.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Not a participant of this match" });
    }
    return match;
  }

  async unmatch(matchId: string, userId: string): Promise<void> {
    const match = await this.getMatchById(matchId, userId);
    await this.matchModel.findByIdAndUpdate(matchId, {
      status: "unmatched",
      unmatchedBy: userId,
      unmatchedAt: new Date(),
    });
    const other = match.participants.find((p) => p.toString() !== userId);
    if (other) {
      await this.redisService.del(
        RedisKeys.matchList(userId),
        RedisKeys.matchList(other.toString()),
      );
      this.eventEmitter.emit("match.unmatched", { matchId, unmatchedBy: userId, otherId: other.toString() });
    }
  }

  async updateLastMessage(matchId: string, preview: string): Promise<void> {
    await this.matchModel.findByIdAndUpdate(matchId, {
      lastMessageAt: new Date(),
      lastMessagePreview: preview.slice(0, 80),
    });
  }
}

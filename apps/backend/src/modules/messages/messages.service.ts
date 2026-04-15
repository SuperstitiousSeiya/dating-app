import { ForbiddenException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import { buildCursorPage } from "@dating-app/utils";
import type { SendMessageDto, GetMessagesQueryDto } from "@dating-app/validators";

import { RedisKeys } from "../../lib/redis-keys";
import { RedisService } from "../../redis/redis.service";
import { MatchesService } from "../matches/matches.service";
import { Message, type MessageDocument } from "./schemas/message.schema";

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    private readonly matchesService: MatchesService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<MessageDocument> {
    // Verify sender is a participant in the match
    const match = await this.matchesService.getMatchById(dto.matchId, senderId);
    if (match.status === "unmatched") {
      throw new ForbiddenException({ code: "MATCH_INACTIVE", message: "Cannot send message to an unmatched user" });
    }

    const message = await this.messageModel.create({
      matchId: dto.matchId,
      senderId,
      content: dto.content,
      type: dto.type ?? "text",
    });

    // Update match's last message preview (fire-and-forget — non-critical)
    void this.matchesService.updateLastMessage(dto.matchId, dto.content);

    // Invalidate unread count cache for the recipient
    const recipientId = match.participants.find((p) => p.toString() !== senderId)?.toString();
    if (recipientId) {
      await this.redisService.del(RedisKeys.unreadCount(recipientId));
    }

    this.eventEmitter.emit("message.sent", { message, recipientId });
    return message;
  }

  async getMessages(
    userId: string,
    matchId: string,
    query: GetMessagesQueryDto,
  ): Promise<{ items: MessageDocument[]; nextCursor: string | null; hasNextPage: boolean }> {
    // Verify user is a participant before returning messages
    await this.matchesService.getMatchById(matchId, userId);

    const filter = {
      matchId,
      deletedAt: null,
      ...(query.cursor ? { _id: { $lt: query.cursor } } : {}),
    };

    const docs = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit + 1)
      .lean<MessageDocument[]>();

    return buildCursorPage(docs, query.limit, (m) => m._id.toString());
  }

  async markRead(userId: string, matchId: string, messageId: string): Promise<void> {
    await this.matchesService.getMatchById(matchId, userId);
    const now = new Date();
    await this.messageModel.updateMany(
      { matchId, _id: { $lte: messageId }, senderId: { $ne: userId }, readAt: null },
      { $set: { readAt: now } },
    );
    await this.redisService.del(RedisKeys.unreadCount(userId));
    this.eventEmitter.emit("message.read", { matchId, userId, readAt: now.toISOString() });
  }
}

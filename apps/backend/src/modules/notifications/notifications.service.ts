import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InjectModel } from "@nestjs/mongoose";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import type { Model } from "mongoose";

import { buildCursorPage, chunk } from "@dating-app/utils";

import { UsersService } from "../users/users.service";
import { Notification, type NotificationDocument } from "./schemas/notification.schema";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getNotifications(
    userId: string,
    cursor?: string,
    limit = 20,
  ) {
    const filter = {
      userId,
      ...(cursor ? { _id: { $lt: cursor } } : {}),
    };
    const docs = await this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean<NotificationDocument[]>();

    return buildCursorPage(docs, limit, (n) => n._id.toString());
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  }

  @OnEvent("match.created")
  async handleMatchCreated(payload: { userAId: string; userBId: string; profileA: unknown; profileB: unknown }): Promise<void> {
    await Promise.all([
      this.createAndPush(payload.userAId, "match", { profile: payload.profileB }),
      this.createAndPush(payload.userBId, "match", { profile: payload.profileA }),
    ]);
  }

  @OnEvent("message.sent")
  async handleMessageSent(payload: { recipientId: string; message: unknown }): Promise<void> {
    if (!payload.recipientId) return;
    await this.createAndPush(payload.recipientId, "message", { message: payload.message });
  }

  private async createAndPush(
    userId: string,
    type: "match" | "message" | "superlike" | "system",
    notificationPayload: Record<string, unknown>,
  ): Promise<void> {
    const notification = await this.notificationModel.create({
      userId,
      type,
      payload: notificationPayload,
    });

    this.eventEmitter.emit("notification.created", { userId, notification });

    const user = await this.usersService.findById(userId);
    if (user?.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      await this.sendExpoPush([
        {
          to: user.expoPushToken,
          sound: "default",
          title: this.getTitleForType(type),
          body: this.getBodyForType(type, notificationPayload),
          data: notificationPayload,
        },
      ]);
    }
  }

  private async sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
    const batches = chunk(messages, 100);
    for (const batch of batches) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(batch);
        this.logger.log(`Sent ${tickets.length} push notifications`);
      } catch (error) {
        this.logger.error("Failed to send push notification batch", error);
      }
    }
  }

  private getTitleForType(type: string): string {
    const titles: Record<string, string> = {
      match: "New Match! 🎉",
      message: "New Message",
      superlike: "Someone Superliked You! ⭐",
      system: "Notification",
    };
    return titles[type] ?? "Notification";
  }

  private getBodyForType(type: string, payload: Record<string, unknown>): string {
    if (type === "match") return "You have a new match! Say hello.";
    if (type === "message") {
      const msg = payload["message"] as { content?: string } | undefined;
      return msg?.content?.slice(0, 50) ?? "You have a new message";
    }
    return "Tap to view";
  }
}

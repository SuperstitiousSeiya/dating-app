import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument, Types } from "mongoose";
import mongoose from "mongoose";

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "notifications" })
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: ["match", "message", "superlike", "system"] })
  type!: "match" | "message" | "superlike" | "system";

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  payload!: Record<string, unknown>;

  @Prop({ required: true, default: false })
  isRead!: boolean;

  createdAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

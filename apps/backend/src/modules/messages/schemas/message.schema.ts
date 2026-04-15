import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument, Types } from "mongoose";
import mongoose from "mongoose";

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "messages" })
export class Message {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true })
  matchId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true, enum: ["text", "gif", "image", "audio"], default: "text" })
  type!: "text" | "gif" | "image" | "audio";

  @Prop({ required: true, maxlength: 2000 })
  content!: string;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ matchId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

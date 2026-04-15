import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument, Types } from "mongoose";
import mongoose from "mongoose";

export type SwipeDocument = HydratedDocument<Swipe>;

@Schema({ timestamps: { createdAt: "seenAt", updatedAt: false }, collection: "swipes" })
export class Swipe {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  actorId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  targetId!: Types.ObjectId;

  @Prop({ required: true, enum: ["like", "pass", "superlike"] })
  action!: "like" | "pass" | "superlike";

  seenAt!: Date;

  @Prop({ type: Date, default: null })
  expiresAt!: Date | null;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);

SwipeSchema.index({ actorId: 1, targetId: 1 }, { unique: true });
SwipeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
SwipeSchema.index({ targetId: 1, action: 1 });

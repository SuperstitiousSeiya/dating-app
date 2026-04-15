import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument, Types } from "mongoose";
import mongoose from "mongoose";

export type MatchDocument = HydratedDocument<Match>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "matches" })
export class Match {
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "User", required: true })
  participants!: Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  initiatedBy!: Types.ObjectId;

  @Prop({ required: true, default: false })
  isSuperlike!: boolean;

  @Prop({ required: true, enum: ["active", "unmatched"], default: "active" })
  status!: "active" | "unmatched";

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  unmatchedBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  unmatchedAt!: Date | null;

  @Prop({ type: Date, default: null })
  lastMessageAt!: Date | null;

  @Prop({ type: String, default: null })
  lastMessagePreview!: string | null;

  createdAt!: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

MatchSchema.index({ participants: 1 });
MatchSchema.index({ participants: 1, status: 1 });
MatchSchema.index({ lastMessageAt: -1 });

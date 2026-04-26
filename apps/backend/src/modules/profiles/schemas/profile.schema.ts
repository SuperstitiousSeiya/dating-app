import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument, Types } from "mongoose";
import mongoose from "mongoose";

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ _id: true })
class ProfilePhoto {
  _id?: Types.ObjectId;
  @Prop({ required: true }) cloudinaryId!: string;
  @Prop({ required: true }) url!: string;
  @Prop({ required: true }) width!: number;
  @Prop({ required: true }) height!: number;
  @Prop({ required: true, min: 0, max: 5 }) order!: number;
  @Prop({ default: false }) isVerificationPhoto!: boolean;
}

@Schema({ _id: false })
class ProfilePrompt {
  @Prop({ required: true, maxlength: 120 }) question!: string;
  @Prop({ required: true, maxlength: 300 }) answer!: string;
}

@Schema({ _id: false })
class AgeRange {
  @Prop({ required: true, min: 18, max: 99 }) min!: number;
  @Prop({ required: true, min: 18, max: 99 }) max!: number;
}

@Schema({ _id: false })
class Preferences {
  @Prop({ type: AgeRange, required: true }) ageRange!: AgeRange;
  @Prop({ required: true, min: 1, max: 300 }) maxDistanceKm!: number;
  @Prop({ type: [String], required: true }) genders!: string[];
  @Prop({
    required: true,
    enum: ["relationship", "casual", "friendship", "unsure"],
    default: "unsure",
  })
  intent!: string;
}

@Schema({ _id: false })
class ProfileStats {
  @Prop({ default: 0 }) likesGiven!: number;
  @Prop({ default: 0 }) likesReceived!: number;
  @Prop({ default: 0 }) superlikesGiven!: number;
  @Prop({ default: 0 }) matchCount!: number;
}

@Schema({ timestamps: true, collection: "profiles" })
export class Profile {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 30 }) displayName!: string;
  @Prop({ required: true }) birthDate!: Date;

  @Prop({ required: true, maxlength: 500, default: "" }) bio!: string;
  @Prop({ required: true, enum: ["man", "woman", "nonbinary", "other"] }) gender!: string;
  @Prop({ type: [String], required: true }) interestedIn!: string[];

  @Prop({ type: [ProfilePhoto], default: [] }) photos!: ProfilePhoto[];
  @Prop({ type: [ProfilePrompt], default: [] }) prompts!: ProfilePrompt[];

  @Prop({
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  })
  location!: { type: "Point"; coordinates: [number, number] };

  @Prop({ default: Date.now }) lastActive!: Date;
  @Prop({ type: Preferences, required: true }) preferences!: Preferences;
  @Prop({ type: ProfileStats, default: () => ({}) }) stats!: ProfileStats;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.index({ location: "2dsphere" });
ProfileSchema.index({ userId: 1 }, { unique: true });
ProfileSchema.index({ gender: 1, "preferences.genders": 1 });

ProfileSchema.virtual("age").get(function () {
  const birth = this.birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

ProfileSchema.set("toJSON", { virtuals: true });
ProfileSchema.set("toObject", { virtuals: true });

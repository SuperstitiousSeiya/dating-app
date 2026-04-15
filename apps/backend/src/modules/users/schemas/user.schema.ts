import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
class OAuthProvider {
  @Prop({ required: true, enum: ["google", "apple"] })
  provider!: "google" | "apple";

  @Prop({ required: true })
  providerId!: string;

  @Prop({ required: true })
  email!: string;
}

@Schema({ _id: false })
class UserSubscription {
  @Prop({ required: true, enum: ["free", "gold", "platinum"], default: "free" })
  tier!: "free" | "gold" | "platinum";

  @Prop({ type: Date, default: null })
  expiresAt!: Date | null;

  @Prop({ type: String, default: null })
  stripeSubscriptionId!: string | null;
}

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ type: String, default: null, sparse: true })
  email!: string | null;

  @Prop({ type: String, default: null })
  phone!: string | null;

  @Prop({ type: String, default: null, select: false })
  passwordHash!: string | null;

  @Prop({ type: [OAuthProvider], default: [] })
  oauthProviders!: OAuthProvider[];

  @Prop({ required: true, enum: ["user", "admin", "moderator"], default: "user" })
  role!: "user" | "admin" | "moderator";

  @Prop({ required: true, default: false })
  isVerified!: boolean;

  @Prop({ required: true, default: false })
  isPhotoVerified!: boolean;

  @Prop({ required: true, default: false })
  isBanned!: boolean;

  @Prop({ type: String, default: null })
  banReason!: string | null;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash!: string | null;

  @Prop({ type: String, default: null })
  expoPushToken!: string | null;

  @Prop({ type: String, default: null })
  stripeCustomerId!: string | null;

  @Prop({ type: UserSubscription, default: () => ({}) })
  subscription!: UserSubscription;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ "oauthProviders.providerId": 1, "oauthProviders.provider": 1 });

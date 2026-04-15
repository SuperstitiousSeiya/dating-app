import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import type { UpdatePushTokenDto } from "@dating-app/validators";

import { compareHash, hashValue } from "../../lib/crypto";
import { User, type UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Creates a new user with email/password credentials.
   * @throws ConflictException if email is already taken.
   */
  async createWithEmail(email: string, password: string): Promise<UserDocument> {
    const exists = await this.userModel.exists({ email: email.toLowerCase() });
    if (exists) {
      throw new ConflictException({ code: "EMAIL_IN_USE", message: "This email is already registered" });
    }
    const passwordHash = await hashValue(password);
    return this.userModel.create({ email: email.toLowerCase(), passwordHash });
  }

  /**
   * Finds or creates a user from an OAuth provider.
   * Returns the user and whether they were newly created.
   */
  async findOrCreateFromOAuth(
    provider: "google" | "apple",
    providerId: string,
    email: string,
  ): Promise<{ user: UserDocument; isNew: boolean }> {
    let user = await this.userModel.findOne({
      "oauthProviders.provider": provider,
      "oauthProviders.providerId": providerId,
    });

    if (user) return { user, isNew: false };

    user = await this.userModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $push: { oauthProviders: { provider, providerId, email } } },
      { new: true },
    );

    if (user) return { user, isNew: false };

    user = await this.userModel.create({
      email: email.toLowerCase(),
      oauthProviders: [{ provider, providerId, email }],
      isVerified: true,
    });

    return { user, isNew: true };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByIdOrThrow(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found" });
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return compareHash(password, user.passwordHash);
  }

  async setRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: hash });
  }

  async getRefreshTokenHash(userId: string): Promise<string | null> {
    const user = await this.userModel
      .findById(userId)
      .select("+refreshTokenHash")
      .lean();
    return user?.refreshTokenHash ?? null;
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { isVerified: true });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hash = await hashValue(newPassword);
    await this.userModel.findByIdAndUpdate(userId, {
      passwordHash: hash,
      refreshTokenHash: null,
    });
  }

  async updatePushToken(userId: string, dto: UpdatePushTokenDto): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      expoPushToken: dto.expoPushToken,
    });
  }

  async softDelete(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isBanned: true,
      banReason: "account_deleted",
      refreshTokenHash: null,
      email: null,
      expoPushToken: null,
    });
  }
}

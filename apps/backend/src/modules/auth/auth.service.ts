import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { EventEmitter2 } from "@nestjs/event-emitter";

import type { AuthResponse, JwtPayload } from "@dating-app/types";

import { compareHash, generateSecureToken, hashValue } from "../../lib/crypto";
import { RedisKeys, RedisTTL } from "../../lib/redis-keys";
import { RedisService } from "../../redis/redis.service";
import type { UserDocument } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.createWithEmail(email, password);
    const otp = await this.generateAndStoreEmailOtp(user.id as string);
    this.eventEmitter.emit("auth.email.verify", { userId: user.id, email, otp });
    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }
    if (user.isBanned) {
      throw new UnauthorizedException({ code: "ACCOUNT_BANNED", message: "Account is suspended" });
    }
    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }
    return this.issueTokens(user);
  }

  async refresh(userId: string, rawRefreshToken: string): Promise<AuthResponse> {
    const storedHash = await this.usersService.getRefreshTokenHash(userId);

    if (!storedHash) {
      throw new UnauthorizedException({ code: "SESSION_EXPIRED", message: "Session has expired. Please log in again." });
    }

    const isValid = await compareHash(rawRefreshToken, storedHash);
    if (!isValid) {
      // Reuse detected — revoke all sessions
      await this.usersService.setRefreshTokenHash(userId, null);
      await this.redisService.del(RedisKeys.refreshSession(userId));
      throw new UnauthorizedException({ code: "TOKEN_REUSE_DETECTED", message: "Security violation. All sessions revoked." });
    }

    const user = await this.usersService.findByIdOrThrow(userId);
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
    await this.redisService.del(RedisKeys.refreshSession(userId));
  }

  async verifyEmail(userId: string, otp: string): Promise<void> {
    const storedOtp = await this.redisService.get(RedisKeys.emailOtp(userId));
    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException({ code: "INVALID_OTP", message: "Invalid or expired verification code" });
    }
    await this.usersService.markEmailVerified(userId);
    await this.redisService.del(RedisKeys.emailOtp(userId));
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Fail silently to prevent user enumeration
    const token = generateSecureToken();
    await this.redisService.set(RedisKeys.passwordReset(token), user.id as string, RedisTTL.PASSWORD_RESET);
    this.eventEmitter.emit("auth.password.reset", { email, token });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redisService.get(RedisKeys.passwordReset(token));
    if (!userId) {
      throw new NotFoundException({ code: "INVALID_TOKEN", message: "Reset token is invalid or expired" });
    }
    await this.usersService.updatePassword(userId, newPassword);
    await this.redisService.del(RedisKeys.passwordReset(token));
  }

  private async issueTokens(user: UserDocument): Promise<AuthResponse> {
    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      sub: user.id as string,
      role: user.role,
      tier: user.subscription.tier,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>("jwt.accessExpiresIn"),
      secret: this.configService.get<string>("jwt.accessSecret"),
    });

    const rawRefreshToken = generateSecureToken();
    const refreshHash = await hashValue(rawRefreshToken);
    await this.usersService.setRefreshTokenHash(user.id as string, refreshHash);

    return {
      accessToken,
      // Note: rawRefreshToken is set as httpOnly cookie in the controller
      // We temporarily store it on the response so the controller can set the cookie
      user: {
        id: user.id as string,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isPhotoVerified: user.isPhotoVerified,
        subscription: {
          tier: user.subscription.tier,
          expiresAt: user.subscription.expiresAt?.toISOString() ?? null,
          stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        },
      },
      // Internal — controller reads this and sets the cookie, then removes it from the response
      _refreshToken: rawRefreshToken,
    } as AuthResponse & { _refreshToken: string };
  }

  private async generateAndStoreEmailOtp(userId: string): Promise<string> {
    const { generateNumericOtp } = await import("../../lib/crypto");
    const otp = generateNumericOtp(6);
    await this.redisService.set(RedisKeys.emailOtp(userId), otp, RedisTTL.EMAIL_OTP);
    return otp;
  }
}

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { JwtPayload } from "@dating-app/types";
import type { SubscriptionTier } from "@dating-app/validators";

import { SUBSCRIPTION_KEY } from "../decorators/subscription.decorator";

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  gold: 1,
  platinum: 2,
};

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier | undefined>(
      SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTier) return true;

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const userTierRank = TIER_RANK[request.user.tier] ?? 0;
    const requiredTierRank = TIER_RANK[requiredTier] ?? 0;

    if (userTierRank < requiredTierRank) {
      throw new ForbiddenException({
        code: "SUBSCRIPTION_REQUIRED",
        message: `This feature requires a ${requiredTier} subscription`,
      });
    }

    return true;
  }
}

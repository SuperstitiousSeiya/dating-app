import { SetMetadata } from "@nestjs/common";

import type { SubscriptionTier } from "@dating-app/validators";

export const SUBSCRIPTION_KEY = "requiredTier";

/**
 * Restricts a route to users with the given subscription tier or above.
 * Tier order: free < gold < platinum
 *
 * @example
 * @RequiresTier("gold")
 * @Post("boost")
 * boost() { ... }
 */
export const RequiresTier = (tier: SubscriptionTier): MethodDecorator =>
  SetMetadata(SUBSCRIPTION_KEY, tier);

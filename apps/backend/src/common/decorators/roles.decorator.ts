import { SetMetadata } from "@nestjs/common";

import type { UserRole } from "@dating-app/types";

export const ROLES_KEY = "roles";

/**
 * Restricts a route to users with the specified roles.
 *
 * @example
 * @Roles("admin", "moderator")
 * @Get("reports")
 * getReports() { ... }
 */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

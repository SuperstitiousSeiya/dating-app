import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import type { JwtPayload } from "@dating-app/types";

/**
 * Extracts the authenticated user's JWT payload from the request.
 *
 * @example
 * async getProfile(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: JwtPayload }>();
    const user = request.user;
    return field ? user[field] : user;
  },
);

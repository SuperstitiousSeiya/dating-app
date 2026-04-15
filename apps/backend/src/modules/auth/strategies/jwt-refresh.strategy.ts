import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { FastifyRequest } from "fastify";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { JwtPayload } from "@dating-app/types";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: FastifyRequest) => {
          const cookie = (req.cookies as Record<string, string | undefined> | undefined)?.[
            "refresh_token"
          ];
          return cookie ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("jwt.refreshSecret"),
      passReqToCallback: true,
    });
  }

  validate(req: FastifyRequest, payload: JwtPayload): JwtPayload & { rawToken: string } {
    const token =
      (req.cookies as Record<string, string | undefined> | undefined)?.["refresh_token"] ?? "";
    if (!token) throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "No refresh token" });
    return { ...payload, rawToken: token };
  }
}

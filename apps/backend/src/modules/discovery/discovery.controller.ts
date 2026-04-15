import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "@dating-app/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { DiscoveryService } from "./discovery.service";

@ApiTags("discovery")
@UseGuards(JwtAuthGuard)
@Controller("discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get("feed")
  async getFeed(@CurrentUser() user: JwtPayload) {
    return this.discoveryService.getFeed(user.sub);
  }
}

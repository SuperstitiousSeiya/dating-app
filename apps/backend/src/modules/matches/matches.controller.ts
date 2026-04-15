import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "@dating-app/types";
import { GetMatchesQuerySchema, type GetMatchesQueryDto } from "@dating-app/validators";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { MatchesService } from "./matches.service";

@ApiTags("matches")
@UseGuards(JwtAuthGuard)
@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async getMatches(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(GetMatchesQuerySchema)) query: GetMatchesQueryDto,
  ) {
    return this.matchesService.getUserMatches(user.sub, query.cursor, query.limit);
  }

  @Delete(":matchId")
  async unmatch(
    @CurrentUser() user: JwtPayload,
    @Param("matchId") matchId: string,
  ): Promise<{ success: true }> {
    await this.matchesService.unmatch(matchId, user.sub);
    return { success: true };
  }
}

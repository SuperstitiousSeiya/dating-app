import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "@dating-app/types";
import { CreateSwipeSchema, type CreateSwipeDto } from "@dating-app/validators";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { SwipesService } from "./swipes.service";

@ApiTags("swipes")
@UseGuards(JwtAuthGuard)
@Controller("swipes")
export class SwipesController {
  constructor(private readonly swipesService: SwipesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async swipe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateSwipeSchema)) dto: CreateSwipeDto,
  ): Promise<{ isMatch: boolean }> {
    return this.swipesService.swipe(user.sub, dto);
  }
}

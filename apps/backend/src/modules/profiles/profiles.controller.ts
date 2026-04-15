import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "@dating-app/types";
import {
  CreateProfileSchema,
  UpdatePreferencesSchema,
  UpdateProfileSchema,
  type CreateProfileDto,
  type UpdatePreferencesDto,
  type UpdateProfileDto,
} from "@dating-app/validators";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ProfilesService } from "./profiles.service";

@ApiTags("profiles")
@UseGuards(JwtAuthGuard)
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  async createProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateProfileSchema)) dto: CreateProfileDto,
  ) {
    return this.profilesService.create(user.sub, dto);
  }

  @Get("me")
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profilesService.findByUserIdOrThrow(user.sub);
  }

  @Patch("me")
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(user.sub, dto);
  }

  @Patch("me/preferences")
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdatePreferencesSchema)) dto: UpdatePreferencesDto,
  ) {
    return this.profilesService.updatePreferences(user.sub, dto);
  }
}

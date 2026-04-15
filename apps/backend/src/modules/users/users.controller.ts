import { Body, Controller, Delete, Patch, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "@dating-app/types";
import { UpdatePushTokenSchema, type UpdatePushTokenDto } from "@dating-app/validators";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { UsersService } from "./users.service";

@ApiTags("users")
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch("push-token")
  async updatePushToken(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdatePushTokenSchema)) dto: UpdatePushTokenDto,
  ): Promise<void> {
    await this.usersService.updatePushToken(user.sub, dto);
  }

  @Delete("me")
  async deleteAccount(@CurrentUser() user: JwtPayload): Promise<{ deleted: true }> {
    await this.usersService.softDelete(user.sub);
    return { deleted: true };
  }
}

import {
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { Readable } from "stream";

import type { JwtPayload } from "@dating-app/types";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { MediaService } from "./media.service";

@ApiTags("media")
@UseGuards(JwtAuthGuard)
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("photos")
  async uploadPhoto(
    @CurrentUser() user: JwtPayload,
    @Req() req: FastifyRequest,
  ) {
    const data = await req.file();
    if (!data) {
      throw new Error("No file provided");
    }
    const order = Number(data.fields["order"] ?? 0);
    return this.mediaService.uploadPhoto(user.sub, Readable.from(data.file), order);
  }

  @Delete("photos/:photoId")
  async deletePhoto(
    @CurrentUser() user: JwtPayload,
    @Param("photoId") photoId: string,
  ) {
    return this.mediaService.deletePhoto(user.sub, photoId);
  }
}

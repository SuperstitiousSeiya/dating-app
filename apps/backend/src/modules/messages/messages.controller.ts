import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { JwtPayload } from "@dating-app/types";
import {
  GetMessagesQuerySchema,
  SendMessageSchema,
  type GetMessagesQueryDto,
  type SendMessageDto,
} from "@dating-app/validators";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { MessagesService } from "./messages.service";

@ApiTags("messages")
@UseGuards(JwtAuthGuard)
@Controller("matches/:matchId/messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(
    @CurrentUser() user: JwtPayload,
    @Param("matchId") matchId: string,
    @Query(new ZodValidationPipe(GetMessagesQuerySchema)) query: GetMessagesQueryDto,
  ) {
    return this.messagesService.getMessages(user.sub, matchId, query);
  }

  @Post()
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param("matchId") matchId: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(user.sub, { ...dto, matchId });
  }

  @Patch(":messageId/read")
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param("matchId") matchId: string,
    @Param("messageId") messageId: string,
  ): Promise<{ success: true }> {
    await this.messagesService.markRead(user.sub, matchId, messageId);
    return { success: true };
  }
}

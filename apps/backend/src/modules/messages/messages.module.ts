import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MatchesModule } from "../matches/matches.module";
import { Message, MessageSchema } from "./schemas/message.schema";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    MatchesModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}

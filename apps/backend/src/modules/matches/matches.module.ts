import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ProfilesModule } from "../profiles/profiles.module";
import { Match, MatchSchema } from "./schemas/match.schema";
import { MatchesController } from "./matches.controller";
import { MatchesService } from "./matches.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
    ProfilesModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService, MongooseModule],
})
export class MatchesModule {}

import { Module } from "@nestjs/common";

import { ProfilesModule } from "../profiles/profiles.module";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

@Module({
  imports: [ProfilesModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}

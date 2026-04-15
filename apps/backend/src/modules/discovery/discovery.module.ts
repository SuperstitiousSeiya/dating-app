import { Module } from "@nestjs/common";

import { ProfilesModule } from "../profiles/profiles.module";
import { SwipesModule } from "../swipes/swipes.module";
import { DiscoveryController } from "./discovery.controller";
import { DiscoveryService } from "./discovery.service";

@Module({
  imports: [ProfilesModule, SwipesModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}

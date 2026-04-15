import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Swipe, SwipeSchema } from "./schemas/swipe.schema";
import { SwipesController } from "./swipes.controller";
import { SwipesService } from "./swipes.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Swipe.name, schema: SwipeSchema }])],
  controllers: [SwipesController],
  providers: [SwipesService],
  exports: [SwipesService, MongooseModule],
})
export class SwipesModule {}

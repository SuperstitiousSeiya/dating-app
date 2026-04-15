import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";

import { appConfig } from "./config/app.config";
import { databaseConfig } from "./config/database.config";
import { jwtConfig } from "./config/jwt.config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { MediaModule } from "./modules/media/media.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { SwipesModule } from "./modules/swipes/swipes.module";
import { UsersModule } from "./modules/users/users.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    // Config — must be first
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      load: [appConfig, databaseConfig, jwtConfig],
    }),

    // Event bus for cross-module communication
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),

    // Rate limiting — Redis-backed in RedisModule
    ThrottlerModule.forRoot([
      { name: "global", ttl: 60_000, limit: 300 },
    ]),

    // Infrastructure
    DatabaseModule,
    RedisModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProfilesModule,
    DiscoveryModule,
    SwipesModule,
    MatchesModule,
    MessagesModule,
    MediaModule,
    NotificationsModule,
  ],
})
export class AppModule {}

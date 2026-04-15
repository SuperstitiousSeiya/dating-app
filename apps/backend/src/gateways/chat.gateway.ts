import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import type { Server, Socket } from "socket.io";

import { SOCKET_EVENTS, type JwtPayload } from "@dating-app/types";

import { RedisKeys, RedisTTL } from "../lib/redis-keys";
import { RedisService } from "../redis/redis.service";

type AuthenticatedSocket = Socket & { user: JwtPayload };

@WebSocketGateway({
  cors: { origin: process.env["ALLOWED_ORIGINS"]?.split(","), credentials: true },
  namespace: "/",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        (socket.handshake.auth as Record<string, string> | undefined)?.["token"] ??
        socket.handshake.headers["authorization"]?.replace("Bearer ", "");

      if (!token) throw new WsException("No token provided");

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>("jwt.accessSecret"),
      });

      socket.user = payload;

      // Join personal room for direct notifications
      await socket.join(`user:${payload.sub}`);

      // Mark as online
      await this.redisService.set(RedisKeys.presence(payload.sub), "1", RedisTTL.PRESENCE);

      this.logger.log(`User ${payload.sub} connected (socket: ${socket.id})`);
    } catch {
      this.logger.warn(`Rejected connection: ${socket.id}`);
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.user) return;
    const userId = socket.user.sub;
    await this.redisService.del(RedisKeys.presence(userId));
    this.server.to(`user:${userId}`).emit(SOCKET_EVENTS.PRESENCE_STATUS, {
      userId,
      online: false,
      lastSeen: new Date().toISOString(),
    });
    this.logger.log(`User ${userId} disconnected`);
  }

  @SubscribeMessage(SOCKET_EVENTS.CHAT_TYPING)
  handleTyping(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string; isTyping: boolean },
  ): void {
    socket.to(`match:${payload.matchId}`).emit(SOCKET_EVENTS.CHAT_TYPING_INDICATOR, {
      userId: socket.user.sub,
      matchId: payload.matchId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage("match:join")
  async handleJoinMatch(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string },
  ): Promise<void> {
    await socket.join(`match:${payload.matchId}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.PRESENCE_PING)
  async handlePresencePing(@ConnectedSocket() socket: AuthenticatedSocket): Promise<void> {
    await this.redisService.set(
      RedisKeys.presence(socket.user.sub),
      "1",
      RedisTTL.PRESENCE,
    );
  }

  /** Broadcasts a new message to all clients in the match room. */
  @OnEvent("message.sent")
  handleMessageSent(payload: { message: unknown; recipientId: string }): void {
    const msg = payload.message as { matchId: { toString: () => string } };
    this.server
      .to(`match:${msg.matchId.toString()}`)
      .emit(SOCKET_EVENTS.CHAT_MESSAGE, payload.message);
  }

  /** Notifies both users when a new match is created. */
  @OnEvent("match.created")
  handleMatchCreated(payload: {
    match: unknown;
    userAId: string;
    userBId: string;
    profileA: unknown;
    profileB: unknown;
  }): void {
    this.server.to(`user:${payload.userAId}`).emit(SOCKET_EVENTS.MATCH_NEW, {
      match: payload.match,
      profile: payload.profileB,
    });
    this.server.to(`user:${payload.userBId}`).emit(SOCKET_EVENTS.MATCH_NEW, {
      match: payload.match,
      profile: payload.profileA,
    });
  }

  /** Broadcasts read receipts to the match room. */
  @OnEvent("message.read")
  handleMessageRead(payload: { matchId: string; userId: string; readAt: string }): void {
    this.server
      .to(`match:${payload.matchId}`)
      .emit(SOCKET_EVENTS.CHAT_READ_RECEIPT, payload);
  }

  /** Pushes an in-app notification to a user's personal room. */
  @OnEvent("notification.created")
  handleNotification(payload: { userId: string; notification: unknown }): void {
    this.server
      .to(`user:${payload.userId}`)
      .emit(SOCKET_EVENTS.NOTIFICATION_PUSH, payload.notification);
  }
}

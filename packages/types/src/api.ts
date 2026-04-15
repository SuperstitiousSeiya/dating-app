/** Standard API success response. */
export type ApiResponse<T> = {
  success: true;
  data: T;
  meta: ResponseMeta;
};

/** Standard API error response. */
export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
  meta: ResponseMeta;
};

/** Cursor-paginated response. */
export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
  meta: ResponseMeta;
};

/** Offset-paginated response. */
export type OffsetPaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
  meta: ResponseMeta;
};

export type ResponseMeta = {
  timestamp: string;
  requestId: string;
};

/** Auth response returned on login/register/refresh. */
export type AuthResponse = {
  accessToken: string;
  user: import("./user").AuthUser;
};

/** Socket event names — typed constants used on both client and server. */
export const SOCKET_EVENTS = {
  // Client → Server
  CHAT_SEND: "chat:send",
  CHAT_READ: "chat:read",
  CHAT_TYPING: "chat:typing",
  PRESENCE_PING: "presence:ping",

  // Server → Client
  CHAT_MESSAGE: "chat:message",
  CHAT_READ_RECEIPT: "chat:read",
  CHAT_TYPING_INDICATOR: "chat:typing",
  MATCH_NEW: "match:new",
  NOTIFICATION_PUSH: "notification:push",
  PRESENCE_STATUS: "presence:status",
} as const;

export type SocketEvents = typeof SOCKET_EVENTS;

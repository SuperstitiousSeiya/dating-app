import type {
  ApiError,
  ApiResponse,
  AuthResponse,
  Match,
  MatchWithProfile,
  Message,
  Notification,
  PaginatedResponse,
  PublicProfile,
} from "@dating-app/types";
import type {
  CreateProfileDto,
  CreateSwipeDto,
  ForgotPasswordDto,
  GetMatchesQueryDto,
  GetMessagesQueryDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
  UpdatePushTokenDto,
  VerifyEmailDto,
} from "@dating-app/validators";

import { withRetry } from "@dating-app/utils";

import { env } from "./env";

// ─── Types ───────────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipRetry?: boolean;
};

// ─── Core fetcher ────────────────────────────────────────────────────────────

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, skipRetry = false, ...init } = options;

  const url = new URL(`${env.API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (_accessToken) headers.set("Authorization", `Bearer ${_accessToken}`);

  const fetchFn = () =>
    fetch(url.toString(), {
      ...init,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(async (res) => {
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as ApiError | null;
        throw new ApiClientError(
          errorBody?.error.code ?? "UNKNOWN_ERROR",
          errorBody?.error.message ?? res.statusText,
          res.status,
          errorBody?.error.details,
        );
      }
      if (res.status === 204) return undefined as T;
      const json = (await res.json()) as ApiResponse<T>;
      return json.data;
    });

  if (skipRetry) return fetchFn();

  return withRetry(fetchFn, {
    maxAttempts: 2,
    shouldRetry: (err) => !(err instanceof ApiClientError) || err.statusCode >= 500,
  });
}

// ─── API namespaces ──────────────────────────────────────────────────────────

export const apiClient = {
  auth: {
    register: (dto: RegisterDto) =>
      request<AuthResponse>("/auth/register", { method: "POST", body: dto }),
    login: (dto: LoginDto) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: dto }),
    refresh: () =>
      request<AuthResponse>("/auth/refresh", { method: "POST", skipRetry: true }),
    logout: () =>
      request<void>("/auth/logout", { method: "POST" }),
    verifyEmail: (dto: VerifyEmailDto) =>
      request<void>("/auth/verify-email", { method: "POST", body: dto }),
    forgotPassword: (dto: ForgotPasswordDto) =>
      request<void>("/auth/forgot-password", { method: "POST", body: dto }),
    resetPassword: (dto: ResetPasswordDto) =>
      request<void>("/auth/reset-password", { method: "POST", body: dto }),
    me: () => request<AuthResponse["user"]>("/auth/me"),
  },

  profiles: {
    create: (dto: CreateProfileDto) =>
      request<PublicProfile>("/profiles", { method: "POST", body: dto }),
    getMe: () => request<PublicProfile>("/profiles/me"),
    update: (dto: UpdateProfileDto) =>
      request<PublicProfile>("/profiles/me", { method: "PATCH", body: dto }),
    updatePreferences: (dto: UpdatePreferencesDto) =>
      request<PublicProfile>("/profiles/me/preferences", { method: "PATCH", body: dto }),
  },

  discovery: {
    getFeed: () =>
      request<PublicProfile[]>("/discovery/feed"),
  },

  swipes: {
    swipe: (dto: CreateSwipeDto) =>
      request<{ isMatch: boolean }>("/swipes", { method: "POST", body: dto }),
  },

  matches: {
    getAll: (query?: GetMatchesQueryDto) =>
      request<PaginatedResponse<MatchWithProfile>>("/matches", { params: query }),
    unmatch: (matchId: string) =>
      request<void>(`/matches/${matchId}`, { method: "DELETE" }),
  },

  messages: {
    getMessages: (matchId: string, query?: GetMessagesQueryDto) =>
      request<PaginatedResponse<Message>>(`/matches/${matchId}/messages`, { params: query }),
    send: (matchId: string, content: string, type = "text") =>
      request<Message>(`/matches/${matchId}/messages`, {
        method: "POST",
        body: { matchId, content, type },
      }),
    markRead: (matchId: string, messageId: string) =>
      request<void>(`/matches/${matchId}/messages/${messageId}/read`, { method: "PATCH" }),
  },

  notifications: {
    getAll: (cursor?: string) =>
      request<PaginatedResponse<Notification>>("/notifications", {
        params: cursor ? { cursor } : undefined,
      }),
    markAllRead: () =>
      request<void>("/notifications/read-all", { method: "PATCH" }),
  },

  users: {
    updatePushToken: (dto: UpdatePushTokenDto) =>
      request<void>("/users/push-token", { method: "PATCH", body: dto }),
    deleteAccount: () =>
      request<{ deleted: true }>("/users/me", { method: "DELETE" }),
  },
} as const;

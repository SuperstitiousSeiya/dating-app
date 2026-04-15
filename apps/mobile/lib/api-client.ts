/**
 * Mobile API client — mirrors the web lib/api-client.ts but uses SecureStore for the token
 * and sends the Bearer token in the Authorization header instead of a cookie.
 */
import type { AuthResponse, PaginatedResponse, PublicProfile, Match, Message } from "@dating-app/types";
import type { LoginDto, RegisterDto, CreateSwipeDto, SendMessageDto, GetMessagesQueryDto } from "@dating-app/validators";
import { withRetry } from "@dating-app/utils";

import { env } from "./env";
import { getAccessToken, saveAccessToken, deleteAccessToken } from "./secure-store";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const { body, ...init } = options;
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const fetchFn = async () => {
    const res = await fetch(`${env.API_URL}${path}`, {
      ...init,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null) as { error?: { code: string; message: string } } | null;
      throw new ApiClientError(
        err?.error?.code ?? "UNKNOWN",
        err?.error?.message ?? res.statusText,
        res.status,
      );
    }

    if (res.status === 204) return undefined as T;
    const json = await res.json() as { data: T };
    return json.data;
  };

  return withRetry(fetchFn, {
    maxAttempts: 2,
    shouldRetry: (e) => !(e instanceof ApiClientError) || (e as ApiClientError).statusCode >= 500,
  });
}

export const apiClient = {
  auth: {
    register: async (dto: LoginDto): Promise<AuthResponse> => {
      const result = await request<AuthResponse>("/auth/register", { method: "POST", body: dto });
      await saveAccessToken(result.accessToken);
      return result;
    },
    login: async (dto: LoginDto): Promise<AuthResponse> => {
      const result = await request<AuthResponse>("/auth/login", { method: "POST", body: dto });
      await saveAccessToken(result.accessToken);
      return result;
    },
    refresh: async (): Promise<AuthResponse> => {
      const result = await request<AuthResponse>("/auth/refresh", { method: "POST" });
      await saveAccessToken(result.accessToken);
      return result;
    },
    logout: async (): Promise<void> => {
      await request<void>("/auth/logout", { method: "POST" });
      await deleteAccessToken();
    },
  },

  profiles: {
    getMe: () => request<PublicProfile>("/profiles/me"),
  },

  discovery: {
    getFeed: () => request<PublicProfile[]>("/discovery/feed"),
  },

  swipes: {
    swipe: (dto: CreateSwipeDto) =>
      request<{ isMatch: boolean }>("/swipes", { method: "POST", body: dto }),
  },

  matches: {
    getAll: (cursor?: string) =>
      request<PaginatedResponse<Match>>("/matches", {
        method: "GET",
        ...(cursor ? {} : {}),
      }),
  },

  messages: {
    getMessages: (matchId: string, query?: GetMessagesQueryDto) =>
      request<PaginatedResponse<Message>>(`/matches/${matchId}/messages`),
    send: (matchId: string, content: string) =>
      request<Message>(`/matches/${matchId}/messages`, {
        method: "POST",
        body: { matchId, content, type: "text" },
      }),
  },
} as const;

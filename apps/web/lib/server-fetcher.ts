import "server-only";

import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";

// ─── Auth token resolution ────────────────────────────────────────────────────
// Server Components can't access the in-memory Zustand access token.
// Instead we exchange the httpOnly refreshToken cookie for a short-lived
// access token on every server render. The call is cheap (<5 ms on localhost)
// and the result is not cached — we always want a fresh token.

async function resolveServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: { accessToken: string } };
    return json.data.accessToken;
  } catch {
    return null;
  }
}

// ─── Generic server fetch ─────────────────────────────────────────────────────

export async function serverFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await resolveServerAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`serverFetch ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── Typed helpers ────────────────────────────────────────────────────────────

export async function fetchDiscoveryFeed() {
  return serverFetch<{ data: unknown[] }>("/discovery/feed");
}

export async function fetchMatches(params?: { limit?: number; cursor?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", params.cursor);
  const query = qs.size ? `?${qs}` : "";
  return serverFetch<{ data: unknown[]; pagination: { nextCursor: string | null } }>(
    `/matches${query}`,
  );
}

export async function fetchMessages(matchId: string, params?: { limit?: number; cursor?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", params.cursor);
  const query = qs.size ? `?${qs}` : "";
  return serverFetch<{ data: unknown[]; pagination: { nextCursor: string | null } }>(
    `/messages/${matchId}${query}`,
  );
}

export async function fetchMatchById(matchId: string) {
  return serverFetch<{ data: unknown }>(`/matches/${matchId}`);
}

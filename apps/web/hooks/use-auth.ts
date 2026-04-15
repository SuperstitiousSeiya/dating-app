"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { apiClient, ApiClientError } from "../lib/api-client";
import { useAuthStore } from "../stores/auth.store";

/**
 * Handles auth state initialization (silent refresh on mount) and
 * exposes login/logout helpers with navigation side effects.
 */
export function useAuth() {
  const { user, accessToken, isInitialized, setAuth, clearAuth, setInitialized } =
    useAuthStore();
  const router = useRouter();

  // Silent token refresh on mount — runs once
  useEffect(() => {
    if (isInitialized) return;

    void (async () => {
      try {
        const result = await apiClient.auth.refresh();
        setAuth(result.user, result.accessToken);
      } catch {
        clearAuth();
      } finally {
        setInitialized();
      }
    })();
  }, [isInitialized, setAuth, clearAuth, setInitialized]);

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }, [clearAuth, router]);

  return {
    user,
    accessToken,
    isAuthenticated: !!user,
    isInitialized,
    logout,
  };
}

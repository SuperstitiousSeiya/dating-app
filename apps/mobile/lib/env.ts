import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;

export const env = {
  API_URL: extra?.["apiUrl"] ?? process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3001/api/v1",
  WS_URL: extra?.["wsUrl"] ?? process.env["EXPO_PUBLIC_WS_URL"] ?? "http://localhost:3001",
} as const;

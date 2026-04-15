import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "spark_access_token";

/**
 * Mobile auth stores the access token in SecureStore instead of memory
 * because React Native doesn't have the same httpOnly cookie protection as browsers.
 * The refresh token is never stored on-device — it lives in the API session.
 */
export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function deleteAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

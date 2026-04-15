/**
 * Typed environment variable access.
 * Throws at import time if a required variable is missing — fail fast.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  API_URL: optionalEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api/v1"),
  WS_URL: optionalEnv("NEXT_PUBLIC_WS_URL", "http://localhost:3001"),
  CLOUDINARY_CLOUD_NAME: optionalEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", ""),
} as const;

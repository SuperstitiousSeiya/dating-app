/**
 * Generates a cryptographically random hex string of the given byte length.
 * Uses the Web Crypto API — works in browsers, Bun, Node ≥ 19, and Edge runtimes.
 */
export function generateToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a numeric OTP of the given digit length.
 */
export function generateOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  const range = max - min;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return String(min + (bytes[0]! % range)).padStart(digits, "0");
}

/**
 * Hashes a value using SHA-256 (Web Crypto).
 * Returns a hex string. For bcrypt, use the backend-specific crypto lib.
 */
export async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a URL-safe base64 encoded random string.
 * Useful for state parameters in OAuth flows.
 */
export function generateState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

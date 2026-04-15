import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

const BCRYPT_ROUNDS = 12;

/**
 * Hashes a plain-text value with bcrypt.
 */
export async function hashValue(value: string): Promise<string> {
  return bcrypt.hash(value, BCRYPT_ROUNDS);
}

/**
 * Compares a plain-text value against a bcrypt hash.
 */
export async function compareHash(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}

/**
 * Generates a cryptographically random opaque token (hex string).
 * Default: 32 bytes → 64-character hex string.
 */
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

/**
 * Generates a numeric OTP of the given length.
 */
export function generateNumericOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  return String(min + (randomBytes(4).readUInt32BE(0) % (max - min)));
}

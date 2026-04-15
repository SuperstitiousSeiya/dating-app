/**
 * Validates an email address using RFC 5322-ish regex.
 * For authoritative validation, always send a verification email.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates an E.164 phone number (e.g. +14155552671).
 */
export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone.trim());
}

/**
 * Validates a 24-character MongoDB ObjectId hex string.
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Validates that a URL is HTTP or HTTPS.
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Strips all HTML tags from a string — lightweight XSS mitigation for display text.
 * For real sanitization, use a dedicated library (DOMPurify on the client).
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

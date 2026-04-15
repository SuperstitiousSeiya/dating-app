/**
 * Truncates a string to `maxLength` characters, appending an ellipsis if truncated.
 */
export function truncate(str: string, maxLength: number, ellipsis = "…"): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Masks an email address for privacy display.
 * e.g. "john.doe@example.com" → "j***.***@example.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked = local.charAt(0) + "*".repeat(Math.max(local.length - 1, 3));
  return `${masked}@${domain}`;
}

/**
 * Converts a camelCase or PascalCase string to "Title Case With Spaces".
 */
export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Pluralizes a word based on count.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Returns true if a string contains only whitespace or is empty.
 */
export function isBlank(str: string): boolean {
  return str.trim().length === 0;
}

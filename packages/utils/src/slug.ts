/**
 * Converts a string to a URL-safe slug.
 * e.g. "Hello World!" → "hello-world"
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a slug with a random suffix to ensure uniqueness.
 * e.g. "hello-world-a3f9"
 */
export function generateUniqueSlug(input: string, suffixLength = 4): string {
  const base = generateSlug(input);
  const bytes = new Uint8Array(Math.ceil(suffixLength / 2));
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, suffixLength);
  return `${base}-${suffix}`;
}

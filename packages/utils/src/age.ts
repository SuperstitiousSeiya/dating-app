/**
 * Calculates a person's age from their birth date.
 * Uses the same logic on both client and server to avoid hydration mismatches.
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

/**
 * Returns the date 18 years ago — used to validate minimum age.
 */
export function getMinBirthDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

/**
 * Returns the date 100 years ago — used to validate maximum age.
 */
export function getMaxBirthDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d;
}

/**
 * Returns whether a birth date results in an age within [min, max].
 */
export function isAgeInRange(
  birthDate: Date | string,
  min: number,
  max: number,
): boolean {
  const age = calculateAge(birthDate);
  return age >= min && age <= max;
}

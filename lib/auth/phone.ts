/** Reduce a user-entered phone number to a comparable digit string.
 * Strips formatting and a leading US country code so "+1 (555) 111-0001",
 * "5551110001", and "1 555 111 0001" all match the same stored value. */
export function normalizePhone(input: string): string {
  let digits = (input ?? "").replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1)
  }
  return digits
}

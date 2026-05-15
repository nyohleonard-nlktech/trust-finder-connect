/**
 * Normalize Cameroonian phone numbers.
 * Any 9-digit number starting with '6' gets prefixed with +237.
 * Numbers already in E.164 (+237...) are returned as-is.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[\s\-()]/g, "").trim();
  if (!digits) return "";
  if (digits.startsWith("+237")) return digits;
  if (digits.startsWith("237") && digits.length === 12) return `+${digits}`;
  if (/^6\d{8}$/.test(digits)) return `+237${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function isValidCameroonPhone(input: string): boolean {
  const n = normalizePhone(input);
  return /^\+237[62]\d{8}$/.test(n);
}

/** Convert a normalized phone to a synthetic email used for Supabase auth. */
export function phoneToAuthEmail(phone: string): string {
  const normalized = normalizePhone(phone);
  // Strip + so the localpart is digits only.
  const localpart = normalized.replace(/\+/g, "");
  return `${localpart}@trustfix.app`;
}

/** For tel: and wa.me links. Returns digits-only with country code (e.g. 237677123456). */
export function phoneForLink(phone: string): string {
  return normalizePhone(phone).replace(/\+/g, "");
}

/**
 * Normalize a Bangladesh mobile number for SteadFast import.
 *
 * Idempotent: running the function on its own output yields the same string.
 * Strips +880 country code and any leading zeros, leaving the bare 10-digit
 * mobile number that SteadFast's import expects.
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return "";

    let cleaned = phoneNumber.replace(/[^\d+]/g, "");

    if (cleaned.startsWith("+880")) {
        cleaned = cleaned.substring(4);
    }

    cleaned = cleaned.replace(/^0+/, "");

    return cleaned;
};

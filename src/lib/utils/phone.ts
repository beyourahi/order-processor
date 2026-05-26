/**
 * BD-specific phone normalizer for SteadFast import. Strips +880 prefix and
 * any leading zeros → bare 10-digit number starting with 1.
 *
 * INVARIANT (NFR-14): idempotent. normalize(normalize(x)) === normalize(x).
 * NOT a general validator — pair with validatePhone() to detect bad numbers.
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

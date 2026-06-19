/**
 * Single source of truth for Copilot image-attachment limits, shared by the
 * client picker, the copilot store, and the server chat schema. Previously the
 * client capped the raw *file* at 8 MB while the server capped the base64 *data
 * URL string* at 8,000,000 chars (≈ only 5.7 MB of decoded bytes), so large
 * GIFs (which bypass client re-encoding) passed the picker but 400'd on the
 * server (FINDINGS.md #3).
 *
 * The advertised cap is the raw file size; the server's string cap is derived
 * from it so anything the picker accepts also validates server-side.
 */

/** Max raw file size the picker accepts (the user-facing "8 MB" limit). */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Max length of a base64 data-URL string for one image. base64 inflates bytes
 * by 4/3; the `+ 64` absorbs the `data:image/...;base64,` prefix. Sized so any
 * file ≤ {@link MAX_IMAGE_BYTES} fits after encoding.
 */
export const MAX_IMAGE_DATA_URL_CHARS = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 64;

/** Max images attached to a single chat turn. */
export const MAX_IMAGES = 3;

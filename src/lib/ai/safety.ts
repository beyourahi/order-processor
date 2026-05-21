/**
 * Anomaly detectors — scan a batch for delivery-risk rows. Results surface in
 * the `flagAnomalies` tool and inside confirmation panels before a mutation.
 *
 * The thresholds below are deliberate, conservative defaults — tune them to the
 * real characteristics of your order batches.
 */
import type { SteadFastOrder } from "$lib/types";
import { normalizePhoneNumber } from "$lib/utils";
import type { AnomalyResult } from "./types";

/* ── Tunable thresholds ───────────────────────────────────────────────────── */
const AMOUNT_OUTLIER_MIN_SAMPLES = 4;
const AMOUNT_OUTLIER_LOW = 0.2; // flag amounts below 0.2× the batch median
const AMOUNT_OUTLIER_HIGH = 5; // flag amounts above 5× the batch median
const MIN_ADDRESS_LENGTH = 18; // chars; below this an address is suspiciously short

/** Cancellation / return language, English + Bengali. */
const CANCELLATION_RE =
    /\b(cancel(?:led|ed)?|return(?:ed)?|refund|do not (?:deliver|send)|hold)\b|বাতিল|ফেরত|হোল্ড|ক্যান্সেল/iu;

const median = (nums: number[]): number => {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    }
    return sorted[mid] ?? 0;
};

/**
 * Runs every detector over a batch and returns a flat list of flagged rows.
 * A single row can trigger multiple anomalies.
 */
export const detectAnomalies = (rows: SteadFastOrder[]): AnomalyResult[] => {
    const out: AnomalyResult[] = [];

    /* Amount outliers vs the batch median. */
    const amounts: number[] = [];
    for (const row of rows) {
        const n = Number.parseFloat(row.Amount);
        if (Number.isFinite(n) && n > 0) amounts.push(n);
    }
    const med = median(amounts);
    if (amounts.length >= AMOUNT_OUTLIER_MIN_SAMPLES && med > 0) {
        rows.forEach((row, i) => {
            const n = Number.parseFloat(row.Amount);
            if (!Number.isFinite(n) || n <= 0) return;
            if (n < med * AMOUNT_OUTLIER_LOW || n > med * AMOUNT_OUTLIER_HIGH) {
                out.push({
                    kind: "amount_outlier",
                    rowIndex: i,
                    reason: `Amount ${n} is far from the batch median of ${med} — verify it.`
                });
            }
        });
    }

    /* Suspiciously short addresses. */
    rows.forEach((row, i) => {
        const addr = (row.Address ?? "").trim();
        if (addr.length > 0 && addr.length < MIN_ADDRESS_LENGTH) {
            out.push({
                kind: "short_address",
                rowIndex: i,
                reason: `Address is only ${addr.length} characters — likely missing the area or thana.`
            });
        }
    });

    /* Cancellation / return language in the note. */
    rows.forEach((row, i) => {
        if (row.Note && CANCELLATION_RE.test(row.Note)) {
            out.push({
                kind: "cancellation_language",
                rowIndex: i,
                reason: "Note mentions cancellation/return language — confirm before dispatching."
            });
        }
    });

    /* Undeliverable phones — landline or malformed numbers SteadFast rejects. */
    rows.forEach((row, i) => {
        const norm = normalizePhoneNumber(row.Phone ?? "");
        if (norm.length > 0 && !/^1\d{9}$/.test(norm)) {
            out.push({
                kind: "landline_phone",
                rowIndex: i,
                reason: `Phone "${row.Phone}" is not a deliverable Bangladesh mobile (landline or malformed).`
            });
        }
    });

    /* Duplicate recipients — same normalized phone on more than one row. */
    const seen = new Map<string, number>();
    rows.forEach((row, i) => {
        const norm = normalizePhoneNumber(row.Phone ?? "");
        if (!norm) return;
        const firstIdx = seen.get(norm);
        if (firstIdx === undefined) {
            seen.set(norm, i);
            return;
        }
        out.push({
            kind: "duplicate_recipient",
            rowIndex: i,
            reason: `Same phone as row ${firstIdx} (${rows[firstIdx]?.Name || "unnamed"}) — possible duplicate order.`
        });
    });

    return out;
};

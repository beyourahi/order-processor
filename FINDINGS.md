# Findings

End-to-end test of the working tree at commit `d2c2a82`. Static gates (`check`, `lint`, `build`), 98 unit tests, live browser E2E (real Wrangler + D1 + Workers AI), and API-contract checks all passed. The items below are the only defects found, ordered by priority.

---

## 1. Legacy non-Shopify CSV path misaligns columns and drops the phone — Medium

**Where:** `src/lib/services/data-processing.ts:21` (`prepareSteadFastOrderData`), `src/lib/constants/indexes.ts:10` (`STEADFAST_INDEXES_ARRAY = [34,36,39,43,11,44]`), consumed positionally by `src/lib/services/processors/steadfast.ts:11`; routed at `src/lib/services/courier-service.ts:35`; reachable via `src/lib/components/features/order-processor.svelte:177` (accepts any `.csv` with no format gate).

**Problem:** When `isShopifyExport` returns false, the legacy path extracts columns in the order `[34,36,39,43,11,44]` → `[Name, Address1, City, Phone, Total, Notes]`, but `SteadFastProcessor` reads them positionally as `[Name, Address, Phone, Amount, Note]`. The slots therefore shift:

- City → **Phone** slot, then `normalizePhoneNumber` strips the non-digit city to `""` → **phone is silently lost**
- Phone → **Amount** slot
- Total → **Note** slot
- the real Notes column (44) is dropped

It also takes only Address1 (no city in the address). `prepareSteadFastOrderData` additionally runs `.slice(1, -1)`, which drops the first and last data rows after dedup.

**Impact:** Any CSV that is not detected as a Shopify export produces silently wrong output with no error shown to the user. The bug is masked today only because `isShopifyExport` (lenient substring match) catches every real Shopify export and routes to the correct `prepareShopifySteadFastOrderData`. Conversely, that same lenient matching means a non-Shopify CSV whose headers merely _contain_ the five sentinel substrings would be treated as Shopify and mapped by the hardcoded indexes — also silently wrong.

**Recommendation:** Either reorder the legacy extractor/`STEADFAST_INDEXES_ARRAY` to match the processor's `[Name, Address, Phone, Amount, Note]` contract, or gate the upload to reject unrecognized CSVs and route them to the Copilot's existing `proposeCsvColumnMapping` flow. (Area already flagged by CLAUDE.md warnings #5/#6.)

---

## 2. No rate limiting on `/api/copilot/chat` — Low/Medium

**Where:** `src/routes/api/copilot/chat/+server.ts` (no limiter); rate limiting in `src/lib/server/auth.ts` applies only to Better Auth's `/api/auth/*` routes (20 req/60s).

**Problem:** The chat endpoint is gated only by authentication, and authorization is "any authenticated Google user." Each call invokes real Workers AI via the AI Gateway (plus a corrective retry and RAG embedding), so an authenticated user can drive unbounded model spend.

**Impact:** Cost/abuse vector; no functional break.

**Recommendation:** Add a per-user, D1-backed rate limit on the chat endpoint (the `rate_limits` table and pattern already exist).

---

## 3. Client/server image-size caps disagree — Low

**Where:** server `src/routes/api/copilot/chat/+server.ts:36` (`images: z.array(z.string().max(8_000_000)).max(3)`) vs client `src/lib/components/features/copilot/copilot-image-upload.svelte` (`MAX_SIZE = 8 * 1024 * 1024`).

**Problem:** The server caps each image _string_ at 8,000,000 chars. A base64 data URL inflates binary size by ~33% plus the `data:...;base64,` prefix, so the server limit corresponds to roughly ~5.7 MB of image bytes — stricter than the client's 8 MB _file_ cap. Images that bypass client re-encoding (GIFs pass through unchanged) and land between ~5.7 MB and 8 MB are accepted by the picker but rejected server-side with a 400.

**Impact:** Rare edge case (large GIFs); the failure surfaces as a generic Copilot error.

**Recommendation:** Align the two caps — express the server limit against decoded byte size, or lower the client cap to match the 8,000,000-char budget.

---

## 4. `touchUpdatedAt` is not user-scoped — Low (hardening)

**Where:** `src/lib/server/repositories/ai-conversations.ts:86` — `touchUpdatedAt(db, id)` updates by `id` only (every other repo function is scoped by `userId`).

**Problem:** Unlike its siblings, this query has no `AND user_id = ?` clause.

**Impact:** Not currently exploitable — its only caller (`chat/+server.ts:299`) passes an id obtained from `getConversation(db, locals.user.id, …)` or `createConversation`, both ownership-verified. This is a defense-in-depth gap, not a live vulnerability.

**Recommendation:** Add a `userId` parameter and `AND user_id = ?` to keep the tenant-isolation invariant uniform across the repository.

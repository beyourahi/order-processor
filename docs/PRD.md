# PRD: In-App Output Editor

## Overview

Insert an interactive **edit-and-review step** between processing and download. Today, the moment a user drops a Shopify CSV onto the upload zone, the app silently invokes `XLSX.writeFile()` and triggers a browser download of the courier-ready `.xlsx` — the user never sees the data the app produced for them, and any mistake (wrong phone digit, garbled address, missing apartment number) is only discoverable downstream inside SteadFast's web portal, after the file has already been imported.

This feature replaces that blind hand-off with an in-app spreadsheet view of the generated output. The user can edit any cell, fix any value, apply bulk changes to batch-constant fields (Contact Name, Contact Phone, Invoice/Merchant ID, Delivery Type, Lot), add or remove rows, then click **Download** to produce the final `.xlsx` from the edited state. The existing upload → drop-zone → courier-picker UX is preserved; the editor takes over the same surface the upload zone occupies, on the same page, without modals, route changes, or layout shifts.

## Problem statement

The current pipeline is fire-and-forget:

```
CSV drop → PapaParse → format detect → SteadFastProcessor → XLSX.writeFile → browser download
```

`order-processor.svelte:50` calls `generateExcel(processedOrders, fileName, "Sheet1")`. The function at `src/lib/utils/excel.ts:6` is a single `XLSX.writeFile()` call — no preview, no confirmation, no escape hatch. Once the file lands in the user's Downloads folder, common defects survive into SteadFast's import:

- **Bad phone numbers.** `normalizePhoneNumber()` at `processors/steadfast.ts:3-15` strips `+880` and leading zeros, but it does not detect missing digits, transposed digits, or landline numbers entered into the mobile field at checkout. Those rows get rejected by SteadFast's import and surface as a vague "invalid recipient" error hours later.
- **Address concatenation artifacts.** Shopify exports split address across columns 36, 37, 39. The concat in `prepareShopifySteadFastOrderData` produces strings like `"House 12, Road 4,  , Dhaka"` (double commas, trailing comma + city) which the courier can deliver but ops staff have to clean up.
- **Note-vs-Address confusion.** Customer notes (column 44) sometimes contain the real address while the address columns contain a landmark. Today there is no opportunity to swap them before export.
- **Wrong Invoice / Contact Phone on a one-off batch.** Brand settings drive Invoice (merchant ID) and Contact Phone for every row. If a user wants to send one batch under a different sender phone (e.g., a partner store, a temporary contact), they must edit brand settings, run the job, then revert — three round-trips for a five-second change.
- **Discovery happens too late.** The first time a user sees the rendered output is inside Excel after the download finished, by which point they have either (a) already imported it to SteadFast or (b) have to edit it in Excel and re-upload — leaving the app entirely.

The feature resolves the above by surfacing the produced data inside the app, in a typed, validated, keyboard-navigable grid, before any file is written.

## Goals and non-goals

### Goals

- After successful processing of an uploaded CSV, the app renders the editor in place of the upload zone with the produced rows pre-loaded. No file is downloaded yet.
- Every cell of the generated output is editable. The user can change any value with one tap on mobile / one click on desktop.
- The user can add new rows and delete existing rows.
- Batch-constant columns (`Invoice`, `Contact Name`, `Contact Phone`, `Delivery Type`, `Lot`) are editable in one place and propagate to all rows in a single action, with the per-row override path still available.
- Validation surfaces obviously-broken values (empty required fields, malformed BD phone, non-numeric Amount) inline without blocking download.
- Download produces an `.xlsx` from the current edited state, matching the existing SteadFast schema byte-for-byte for rows the user did not touch.
- "Discard" returns to the empty upload zone without writing a file. No partial state survives across page loads.
- The editor lives on the same page as the upload zone, sized inside the existing dropzone footprint by default and able to grow to a wider column on demand. No modal, no route push, no layout reflow of the surrounding shell (header, footer, brand-settings, courier picker remain pinned).

### Non-goals

- Persisting edited output to D1. Each edit session is ephemeral; closing/reloading the page resets to the upload zone. (Captured for [Future considerations](#future-considerations).)
- Multi-user collaboration on the same output (no real-time co-editing, no shared sessions).
- Re-uploading an edited `.xlsx` back through the editor. The editor is downstream of the CSV intake, never an entry point.
- Editing the source CSV. Edits apply to the **generated courier output**, not the raw Shopify export.
- Importing data from `.xlsx` (Excel files) as the entry point. CSV remains the only intake format.
- Building a generic spreadsheet (formulas, charts, multi-sheet, cell formatting, conditional rules). The editor is a typed-row form rendered as a table, not a spreadsheet engine.
- Reordering columns or hiding columns. Schema is fixed by the courier processor.
- Auto-saving drafts to local storage, IndexedDB, or D1. Edit state is in-memory only.
- Server-side processing of the edits. All edit logic is client-side, same as the existing pipeline.

## Users and use cases

Single primary persona: the brand operator who runs the daily Shopify-to-SteadFast batch. Authenticated via Google OAuth (the only auth gate). One user at a time on one batch at a time.

Primary use cases:

1. **Spot-fix a phone number.** Operator notices a Phone cell missing a digit, taps it, types the fix, hits Download.
2. **Clean up a Shopify address concat artifact.** Operator sees `"House 12, , Dhaka"`, deletes the double comma, downloads.
3. **Override Contact Phone for one batch.** Operator changes the batch-level Contact Phone in the defaults strip — every row updates in one action — downloads, then continues with brand defaults intact for the next batch.
4. **Delete a duplicate or test order.** Operator selects a row, deletes it, downloads.
5. **Add a missing order that didn't make it into the Shopify export.** Operator clicks "Add row", fills in the five variable columns (Name, Address, Phone, Amount, Note), downloads. Batch-constant columns auto-fill from the defaults strip.
6. **Swap Address and Note when the customer put the real address in checkout notes.** Operator clicks Address, cuts; clicks Note, pastes the address; types the landmark into Address. Downloads.
7. **Discard and start over.** Operator realizes they dropped the wrong CSV, clicks Discard, drops the right one.

Out-of-scope use cases: bulk find-and-replace, regex transforms, column-formula derivation, importing edits from another file.

## Current state

### The processing → download path

`src/lib/components/features/order-processor.svelte` is the orchestrator. Lines 36–62 contain the full pipeline inside `handleFileSelect`:

```ts
const result = await parseCSV(file);                          // PapaParse → string[][]
const processedOrders = CourierService.processOrders(         // → SteadFastOrder[]
    selectedCourier as Courier,
    result.data,
    { name, phone, merchantId }
);
const fileName = generateFileName(selectedCourier);
generateExcel(processedOrders, fileName, "Sheet1");           // → writes .xlsx, browser download
setTimeout(() => { acceptedFile = null; }, 2000);             // → resets UI after 2s
```

The dropzone occupies a fixed footprint: `h-56 sm:h-64 md:h-72 lg:h-80`, `lg:max-w-md xl:max-w-lg`. Inside the zone, the component switches between four states via `{#if}` branches: `error`, `isProcessing`, `acceptedFile` (download success card), `else` (the empty upload affordance). This switching pattern is the seam where the editor will be inserted as a new state.

### Output schema (SteadFast)

From `src/lib/types/courier.ts`:

| Column | Source | Variability |
|---|---|---|
| `Invoice` | `user.merchantId` (brand_settings) | Batch-constant |
| `Name` | row[0] (per order) | Per-row |
| `Address` | row[1] (per order) | Per-row |
| `Phone` | row[2] normalized via `normalizePhoneNumber()` | Per-row |
| `Amount` | row[3] | Per-row |
| `Note` | row[4] | Per-row |
| `Lot` | hardcoded `""` | Batch-constant |
| `Delivery Type` | hardcoded `"Home"` | Batch-constant |
| `Contact Name` | `user.name` (brand_settings or Google profile) | Batch-constant |
| `Contact Phone` | `user.phone` (brand_settings) | Batch-constant |

Five per-row, five batch-constant. This split drives the editor's two-region layout.

### Excel writer

`src/lib/utils/excel.ts` is three lines that wrap SheetJS:

```ts
export const generateExcel = <T extends object>(data: T[], fileName: string, sheetName = "Sheet1"): void => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
};
```

The function couples "build workbook" and "trigger browser download" into one call. The editor needs both halves separately: build workbook on every edit (for `<a download>` link) **or** keep the in-memory array and only build/write on the explicit Download click. The latter is simpler and avoids per-keystroke serialization.

### Component library and styling

- shadcn-svelte (new-york style, zinc base) — `Button`, `Input`, plus whatever the editor needs.
- `bits-ui` is available as the headless primitive substrate (already a transitive dep of shadcn-svelte).
- Tailwind CSS v4 with CSS-first config in `src/app.css`.
- No table component exists in the project today — `components/ui/` currently ships `button`, `footer`, `heading`, `input`, `loading-spinner`.
- A `Table` primitive from shadcn-svelte will be added (`bunx shadcn-svelte@latest add table`) but is presentational only; the editing layer is custom on top of it.

### Mobile constraint

`src/app.css` enforces a 16px minimum font on touch devices via `@media (pointer: coarse)` to prevent iOS Safari from auto-zooming on input focus. Any cell input the editor renders must respect this — `text-base` minimum, never `text-sm` on touch.

## Proposed solution

A new client-side editor component replaces the current "auto-download-and-flash-a-success-gif" terminal state inside `order-processor.svelte`. The pipeline becomes:

```
CSV drop → PapaParse → format detect → SteadFastProcessor → in-memory SteadFastOrder[]
       → render <OutputEditor> in place of the upload zone
       → user edits, adds rows, deletes rows, edits batch defaults
       → user clicks Download → XLSX.writeFile(currentState, fileName)
       → user clicks Discard → state cleared, upload zone returns
```

The editor is a self-contained Svelte 5 runes component with two visual regions stacked vertically:

1. **Batch defaults strip** — a compact horizontal form binding the five batch-constant fields (`Invoice`, `Contact Name`, `Contact Phone`, `Delivery Type`, `Lot`). Editing any field here updates that column in every row in the grid via a single `$effect`. Each field also has a small "✎ row-level" indicator that lights up when one or more rows have an override different from the strip value.
2. **Per-row grid** — a table of rows × five per-row columns (`Name`, `Address`, `Phone`, `Amount`, `Note`). Click/tap a cell to edit. Tab/Enter/arrow keys navigate. A leading column shows the row index and per-row controls (delete, duplicate). An "Add row" button at the bottom appends a row pre-populated from the batch defaults strip.

Below the grid sits a sticky **action bar** with: row count badge ("47 orders"), validation summary ("3 warnings — click to jump"), **Discard**, **Download**. Discard returns the surface to the empty upload zone; Download serializes the current state to `.xlsx` via the existing SheetJS dependency and fires `XLSX.writeFile()`.

The surrounding shell (header, courier picker, brand settings, footer) does not move. The editor expands the dropzone footprint downward as more rows render but never grows wider than the page content column. On mobile the grid horizontally scrolls inside its container; the batch defaults strip stacks vertically.

All state stays in-memory in component-local `$state` runes. There is no D1 write, no API call, no service-worker cache. Reloading the page resets to the upload zone.

## Functional requirements

### Entry into the editor

**FR-1.** After successful processing of an uploaded CSV, the app renders the editor in place of the upload zone with the produced rows pre-loaded.
*Acceptance:* Dropping a valid 47-order Shopify export results in the editor rendering 47 rows within 250ms of `CourierService.processOrders` resolving, and no `.xlsx` file is downloaded.

**FR-2.** If processing fails (invalid CSV, unrecognized format, processor throws), the editor does not render. The existing error state is preserved.
*Acceptance:* Dropping a non-CSV file or a CSV that produces zero rows shows the existing error message and a "Try again" button; no editor instance is created.

**FR-3.** If processing succeeds but produces zero rows, the editor still renders empty with the batch defaults strip populated and an "Add row" button enabled.
*Acceptance:* A CSV that contains only the Shopify header line yields an empty grid plus a populated defaults strip; the user can manually add rows.

### Per-cell editing

**FR-4.** Every cell in the per-row grid is editable by single click (desktop) or single tap (touch).
*Acceptance:* Clicking any cell in `Name`, `Address`, `Phone`, `Amount`, `Note` columns enters edit mode with the cursor at the click position (text columns) or at the end (numeric/tel columns).

**FR-5.** Edit mode commits on `Enter`, `Tab`, blur, or any arrow-key navigation. `Escape` reverts the cell to its pre-edit value.
*Acceptance:* Typing into a cell and pressing `Escape` restores the original value; pressing any commit key persists the new value to component state.

**FR-6.** `Tab` and `Shift+Tab` move focus to the next/previous editable cell, wrapping rows.
*Acceptance:* Tabbing from the rightmost column of row N moves focus to the leftmost column of row N+1; Shift+Tab from leftmost column of row N moves to rightmost of row N−1.

**FR-7.** Arrow keys (`↑`/`↓`/`←`/`→`) navigate between cells when not in edit mode, and act as text-cursor controls when in edit mode.
*Acceptance:* In edit mode, `←`/`→` move within the cell text; out of edit mode (after Enter/Escape), the same keys move between cells.

**FR-8.** Per-column input type matches the data:
- `Name` — text
- `Address` — text (multi-line on overflow, expand-on-focus)
- `Phone` — `inputmode="tel"`, `autocomplete="off"`
- `Amount` — `inputmode="decimal"`, accepts digits and one decimal point
- `Note` — text (multi-line on overflow, expand-on-focus)

*Acceptance:* On mobile, focusing `Phone` opens the numeric keypad; focusing `Amount` opens the decimal keypad; focusing `Name`/`Address`/`Note` opens the full keyboard.

**FR-9.** Phone normalization (`normalizePhoneNumber()`) does **not** auto-apply on edit. User input is trusted verbatim until Download, at which point a single normalization pass runs over the Phone column.
*Acceptance:* Typing `+880171234567` into a Phone cell shows `+880171234567` in the cell while editing; downloading produces the normalizer's output in the `.xlsx`. The cell display does not change between commit and download.

### Batch defaults strip

**FR-10.** The five batch-constant columns are surfaced as five form fields above the grid: `Invoice`, `Contact Name`, `Contact Phone`, `Delivery Type`, `Lot`.
*Acceptance:* On editor entry, all five fields are populated with the values from `brandSettings` (or hardcoded defaults for `Delivery Type="Home"` and `Lot=""`).

**FR-11.** Editing a batch defaults field updates the corresponding column in every grid row that has not been individually overridden.
*Acceptance:* Changing `Contact Phone` from `01711111111` to `01722222222` in the strip updates the `Contact Phone` column in all rows that previously matched the old value. Rows whose `Contact Phone` was individually edited to a different value remain untouched and surface an "override" indicator.

**FR-12.** Per-row overrides of batch-constant columns are reachable via a "Show batch columns" toggle on the grid.
*Acceptance:* When toggled on, the grid displays all ten columns; when off (default), only the five per-row columns are visible.

**FR-13.** A "Reset overrides" action on each batch defaults field restores all per-row overrides for that column to the strip's current value.
*Acceptance:* Clicking "Reset overrides" next to `Contact Phone` propagates the strip value to every row's `Contact Phone` and clears all override indicators for that column.

**FR-14.** Edits to the batch defaults strip do **not** modify the user's persisted `brand_settings` in D1.
*Acceptance:* After editing `Contact Phone` in the strip and downloading, reloading the page and entering the editor with a fresh CSV shows the original `brand_settings` value, not the previously-edited one.

### Row management

**FR-15.** The user can delete any row.
*Acceptance:* Clicking the per-row delete control on row N removes it from state immediately. No confirmation dialog. An undo affordance appears in the action bar for 5 seconds.

**FR-16.** The user can duplicate any row.
*Acceptance:* Clicking the per-row duplicate control on row N inserts a copy directly below it; focus moves to the `Name` cell of the new row.

**FR-17.** The user can add a new row.
*Acceptance:* Clicking "Add row" appends a new row at the bottom with empty per-row fields and batch-constant fields pre-filled from the defaults strip. Focus moves to the `Name` cell of the new row.

**FR-18.** The user can undo the last destructive action (delete, bulk reset).
*Acceptance:* A `Cmd/Ctrl+Z` keypress or click on the toast "Undo" action restores the deleted row(s) to their original positions within 5 seconds of the action. After 5 seconds the action is permanent.

**FR-19.** The user can multi-select rows for bulk delete.
*Acceptance:* `Shift+Click` extends a row selection; `Cmd/Ctrl+Click` toggles individual rows. A bulk "Delete selected" control appears in the action bar when ≥1 row is selected.

### Validation

**FR-20.** Empty required cells (`Name`, `Address`, `Phone`, `Amount`) display a warning indicator on the cell.
*Acceptance:* A row with an empty `Phone` cell shows a yellow border on the cell and contributes to the action bar's warning count.

**FR-21.** Malformed BD phone numbers display a warning. Detection rule: after `normalizePhoneNumber()` would run, the result is not exactly 10 digits or does not start with `1`.
*Acceptance:* A `Phone` of `12345` shows a warning; `01712345678` shows no warning (normalizes to a 10-digit string starting with `1`); `+8801712345678` shows no warning; `landline 02-9876543` shows a warning.

**FR-22.** Non-numeric `Amount` cells display a warning.
*Acceptance:* `Amount` of `1500` or `1500.50` shows no warning; `1500 taka`, `abc`, or empty shows a warning.

**FR-23.** Validation is advisory, never blocking. The user can Download with any number of warnings.
*Acceptance:* A row with two warnings still contributes to the downloaded `.xlsx`. The Download button never disables on validation grounds.

**FR-24.** Clicking the action bar's warning summary scrolls the grid to the first warning cell and focuses it.
*Acceptance:* If the first warning is in row 12 column `Phone`, clicking the summary scrolls row 12 into view and focuses the `Phone` cell.

### Download and discard

**FR-25.** The Download button serializes the current editor state to `.xlsx` and triggers a browser download, using the existing `generateFileName(selectedCourier)` for the filename.
*Acceptance:* Clicking Download produces `formatted-orders-steadfast.xlsx` whose row count and column order match the editor state. The Phone column is normalized in the produced file.

**FR-26.** Download does **not** clear the editor state. The user can edit further and download again.
*Acceptance:* After downloading once, the editor remains visible with all rows intact; making further edits and clicking Download again produces a new file reflecting the latest state.

**FR-27.** The Discard button clears the editor state, returns the surface to the empty upload zone, and shows no confirmation dialog if the editor state is unchanged from initial processing.
*Acceptance:* Dropping a CSV → immediately clicking Discard returns to the upload zone without prompt.

**FR-28.** If the editor state differs from initial processing, Discard shows a confirmation dialog.
*Acceptance:* After editing any cell, deleting a row, or modifying the defaults strip, clicking Discard prompts "Throw away your edits?" with Discard/Cancel buttons.

**FR-29.** Reloading the page or navigating away always discards editor state without warning.
*Acceptance:* `window.beforeunload` is **not** wired to the editor's dirty state. State is intentionally ephemeral.

### Surface behavior

**FR-30.** The editor renders inside the same surface as the upload zone and does not push the page header, courier picker, brand settings, or footer off-screen.
*Acceptance:* On a 1440×900 viewport, header and footer remain visible without scrolling when the editor is empty; with 50+ rows the editor's grid scrolls inside its own container, not the page.

**FR-31.** The editor's container grows in height proportionally to row count, capped at a viewport-fraction maximum (`max-h-[60vh]` on desktop, `max-h-[50vh]` on mobile); beyond the cap, the grid scrolls internally.
*Acceptance:* A 200-row batch renders in a scroll container of capped height; the action bar remains visible without scrolling the page.

**FR-32.** The editor is keyboard-navigable end-to-end with no mouse required.
*Acceptance:* Starting from the upload zone after a drop completes, `Tab` reaches the defaults strip, the grid (one tab stop per cell when in navigation mode), the action bar, in document order. No focus trap.

## Non-functional requirements

### Performance

- **NFR-1.** Time-to-first-paint of the editor after `CourierService.processOrders` resolves: ≤ 250ms for batches ≤ 100 rows on a mid-tier laptop (M1 baseline).
- **NFR-2.** Cell edit commit (typing → state update → visual reflect): ≤ 16ms per keystroke. No visible lag on 500-row batches.
- **NFR-3.** Download (serialize current state → trigger `.xlsx` write) for 500 rows: ≤ 500ms wall-clock.
- **NFR-4.** Memory ceiling: editor state for 1000 rows must not exceed 5MB heap. (Each row is ~10 string fields averaging ~50 chars; back-of-envelope ~500KB raw plus framework overhead.)
- **NFR-5.** Grid scrolling at 60fps on 500 rows.

### Accessibility

- **NFR-6.** All editor controls meet WCAG 2.2 AA contrast against the existing zinc-on-dark theme. Cell border warning colors use both color and an icon (so red-green color blindness does not hide warnings).
- **NFR-7.** Each cell has a programmatic accessible name combining column header + row index ("Phone, row 12"). Screen readers announce both on focus.
- **NFR-8.** Live region announces row add/delete and validation-state changes.
- **NFR-9.** All interactive elements have ≥ 44×44px touch targets on mobile (the action bar buttons and per-row controls).
- **NFR-10.** Focus is never trapped inside the editor; users can `Tab` out of it to reach the footer or page-level controls.

### Browser compatibility

- **NFR-11.** Supports the same browser matrix as the rest of the app: last two stable versions of Chrome, Safari, Firefox, Edge on desktop, plus Safari iOS and Chrome Android.
- **NFR-12.** No reliance on browser APIs unavailable in Safari iOS 17+ (Clipboard API write is OK; File System Access API is not used).

### Reliability

- **NFR-13.** Discarding edits never writes a file. The `.xlsx` writer is invoked from exactly one code path: the Download button's click handler.
- **NFR-14.** Phone normalization runs exactly once per cell per Download — never on input, never twice. Idempotency: running normalization a second time on its own output produces the same string.

### Security

- **NFR-15.** No editor data is sent to the server. Edits live in component-local Svelte state and the only side effect is the local `.xlsx` write.
- **NFR-16.** Pasted cell values are HTML-escaped on render. (SheetJS does its own escaping in `.xlsx` output, but the editor's DOM render must not interpolate raw user input into innerHTML.)

## Technical architecture

### Stack additions

No new runtime services. No new D1 tables. No new API endpoints. No new Cloudflare bindings.

The feature is purely client-side. Existing dependencies cover everything needed:

- **SheetJS (`xlsx`)** — already present, already invoked by `generateExcel`. Refactor splits it into `buildWorkbook` and `writeWorkbook` so the editor can hold the workbook (or just the row array) in memory and only serialize on Download.
- **shadcn-svelte Table** — add via `bunx shadcn-svelte@latest add table`. Presentational only.
- **bits-ui** — already transitively present via shadcn-svelte; primitives for focus management and any popover (override indicators).

### Component graph

```
src/lib/components/features/
  order-processor.svelte                  -- existing orchestrator; adds new editor state branch
  output-editor/                          -- NEW directory
    output-editor.svelte                  -- top-level editor; owns rows + defaults state
    batch-defaults-strip.svelte           -- the 5-field horizontal form above the grid
    editor-grid.svelte                    -- table of per-row cells
    editor-row.svelte                     -- one row of the grid, including per-row controls
    editor-cell.svelte                    -- one cell; switches between display + input modes
    action-bar.svelte                     -- sticky bottom bar with counts, warnings, Discard, Download
    index.ts                              -- barrel export
```

State ownership:

- **`output-editor.svelte`** owns:
    - `rows: SteadFastOrder[]` — `$state` array
    - `defaults: { Invoice, "Contact Name", "Contact Phone", "Delivery Type", Lot }` — `$state`
    - `selection: Set<number>` — `$state`, row indexes
    - `lastDeletedRows: { row: SteadFastOrder; index: number }[] | null` — for undo
    - `warnings: $derived` — computed from rows
    - `dirty: $derived` — true if rows or defaults differ from initial
- **`editor-cell.svelte`** owns:
    - `localValue: string` — the in-flight edit; commits to parent on Enter/Tab/blur, reverts on Escape

Bindings between editor and orchestrator are minimal: `<OutputEditor initialRows={processedOrders} initialDefaults={...} onDiscard={...} />`. Editor never reads `brandSettings` directly — the orchestrator passes the initial values in. This keeps the editor pure and trivially unit-testable.

### Refactor of `excel.ts`

Current:

```ts
export const generateExcel = <T extends object>(data, fileName, sheetName): void => { /* build + write */ };
```

New:

```ts
export const buildWorkbook = <T extends object>(data: T[], sheetName = "Sheet1"): XLSX.WorkBook => { /* build */ };
export const writeWorkbook = (wb: XLSX.WorkBook, fileName: string): void => XLSX.writeFile(wb, fileName);
// Back-compat wrapper retained for any caller that still wants the old single-call shape:
export const generateExcel = <T extends object>(data, fileName, sheetName = "Sheet1"): void =>
    writeWorkbook(buildWorkbook(data, sheetName), fileName);
```

The editor calls `writeWorkbook(buildWorkbook(currentRows), fileName)` from its Download handler. The current `generateExcel` call inside `order-processor.svelte` is replaced by mounting the editor.

### Refactor of `order-processor.svelte`

The current state machine has four branches: `error`, `isProcessing`, `acceptedFile` (showing `<Download>` GIF), `else` (showing `<Upload>`). A fifth branch is added: `editorRows` (showing `<OutputEditor>`).

```svelte
{#if error}             <!-- existing -->
{:else if isProcessing} <!-- existing -->
{:else if editorRows}   <!-- NEW: rendered when processing has produced rows -->
    <OutputEditor
        initialRows={editorRows}
        initialDefaults={editorDefaults}
        fileName={editorFileName}
        onDiscard={() => editorRows = null}
    />
{:else}                 <!-- existing upload affordance -->
{/if}
```

The `acceptedFile` / `<Download>` GIF branch is **removed** — the success state is now "you are in the editor" not "a file is downloading." The `download.gif` asset and `Download` component are deleted unless reused for the in-editor Download button affordance.

The dropzone shell (the outer `<div>` with `role="button"`, drag handlers, etc.) is preserved when the editor is **not** active. When the editor is active, the orchestrator renders the editor outside the dropzone shell so drag-and-drop is disabled while editing — accidentally dropping a second file mid-edit should require an explicit Discard first.

### Phone normalization on Download

`normalizePhoneNumber` (currently in `processors/steadfast.ts`) is extracted to a shared utility and called once per Phone cell at Download time. It is **not** called during input. Rationale in FR-9.

The processor still runs its initial normalization during the initial `CourierService.processOrders` pass — that path is unchanged. Only the editor's Download path adds a second idempotent normalization to catch user edits like `+880...` being typed into a fixed cell.

### State persistence

None. Editor state is in-memory only and clears on:
- Reload (FR-29)
- Discard (FR-27, FR-28)
- Navigation away
- Tab close

If the user accidentally closes the tab mid-edit, the edits are lost. This is intentional and called out in [Risks](#risks-and-mitigations).

## Data model and contracts

No D1 schema changes. No KV. No R2. No new API routes.

Component prop contracts:

```ts
// output-editor.svelte
interface OutputEditorProps {
    initialRows: SteadFastOrder[];
    initialDefaults: {
        Invoice: string;
        "Contact Name": string;
        "Contact Phone": string;
        "Delivery Type": string;
        Lot: string;
    };
    fileName: string;
    onDiscard: () => void;
    // No onDownload — the editor owns the download action and never bubbles it.
}

// editor-cell.svelte
type CellColumn = "Name" | "Address" | "Phone" | "Amount" | "Note"
    | "Invoice" | "Contact Name" | "Contact Phone" | "Delivery Type" | "Lot";

interface EditorCellProps {
    value: string;
    column: CellColumn;
    rowIndex: number;
    warning: string | null;             // null = no warning; string = warning text for tooltip + a11y
    onCommit: (newValue: string) => void;
}
```

Validation contract:

```ts
interface CellWarning {
    rowIndex: number;
    column: CellColumn;
    code: "empty" | "phone_format" | "amount_format";
    message: string;
}

function validateRow(row: SteadFastOrder, rowIndex: number): CellWarning[];
function validatePhone(value: string): boolean;
function validateAmount(value: string): boolean;
```

Workbook serialization contract is unchanged from current behavior: SheetJS `json_to_sheet` of the `SteadFastOrder[]` array, single sheet named `"Sheet1"`. The `.xlsx` output is byte-for-byte identical to the current `generateExcel` output for any input the user does not modify.

## UX and design direction

### Layout

The editor occupies the same horizontal column as the existing dropzone (`lg:max-w-md xl:max-w-lg`) at rest, and expands to a wider footprint (`xl:max-w-4xl`) the moment it is mounted with non-empty data. The transition is animated subtly (~150ms ease-out width interpolation). Header, courier picker, brand settings, and footer never move.

Vertical structure top-to-bottom:

1. **Batch defaults strip** (5 fields, ~80px tall)
2. **Per-row grid** (variable height, capped at viewport fraction, scrolls internally beyond cap)
3. **Action bar** (sticky to bottom of editor container, ~56px tall)

### Visual language

Matches the existing app:
- Background: same dark surface tokens as the rest of the app (`bg-surface`, `bg-surface-raised`).
- Borders: existing `border-border-strong` / `border-border` tokens.
- Cell focus: 2px white ring at 50% opacity, matching the existing focus-visible style.
- Warning cells: 1px amber border + an `⚠` icon in the top-right corner of the cell, never red (red is reserved for destructive actions).
- Override indicators: a thin accent dot (`courier-accent` color) above the strip field name when one or more rows diverge.

### Cell editing interaction

Single-click enters edit mode. The cell becomes a plain `<input>` matching the column's data type (text / tel / decimal). The input has no chrome of its own — no border, no inner padding — it sits flush inside the cell so the visual layout does not jitter on enter/exit. The cell's existing 1px bottom border remains as the only static affordance.

On commit (Enter / Tab / blur), the input flattens back to a `<span>` display. On Escape, the input reverts and flattens. No fade, no slide.

### Empty grid

When the editor mounts with zero rows (FR-3), the grid area shows a single-row placeholder: "No orders yet — click Add row to create the first."

### Mobile

The defaults strip wraps to two-column → single-column at narrow widths. The grid horizontally scrolls inside its container — the user pans the row to reach further columns. Touch targets are ≥ 44px (per NFR-9). Cell text is `text-base` (16px) minimum to honor the existing iOS anti-zoom rule in `app.css`.

### Motion

- Row insertion (Add row, Duplicate, Undo): 100ms slide-down + 100ms fade-in.
- Row deletion: 100ms fade-out, then collapse.
- No global transitions, no decorative motion. The editor mount is instant.

### Color and tier semantics (re-used from existing palette)

| Element | Token |
|---|---|
| Editable cell background (normal) | `bg-surface` |
| Editable cell background (focused) | `bg-surface-raised` |
| Editable cell background (selected row) | `bg-surface-raised/70` |
| Cell warning border | `border-amber-500/60` |
| Override indicator dot | `bg-courier-accent` |
| Destructive (delete row, Discard) | `text-destructive` |
| Primary action (Download) | matches existing primary button style |

## Dependencies

### New dependencies

None expected to be added. Use what's already in the project:

- `xlsx` (SheetJS) — already a dep; refactor only
- `bits-ui` — already transitive via shadcn-svelte; primitives for focus management
- `tailwind-merge`, `clsx` — already deps; used in `cn()`

### New shadcn-svelte components

- `Table` — `bunx shadcn-svelte@latest add table`. Presentational only.

### Code lifted from existing project

| Source | Target |
|---|---|
| `normalizePhoneNumber` (`processors/steadfast.ts:3-15`) | `$lib/utils/phone.ts` — extracted; called from processor + editor download path |
| `generateExcel` (`utils/excel.ts:3-8`) | Split into `buildWorkbook` + `writeWorkbook`; existing call shape retained as a wrapper |

## Work breakdown

The feature decomposes into the following discrete pieces of work. Order is governed only by hard dependencies; pieces without a dependency arrow are independent and parallelizable.

- **Split the Excel writer.** Refactor `src/lib/utils/excel.ts` into `buildWorkbook` + `writeWorkbook`. Retain `generateExcel` as a thin wrapper so the existing call site continues to compile. *(No dependency.)*
- **Extract phone normalization.** Move `normalizePhoneNumber` from `src/lib/services/processors/steadfast.ts` into `src/lib/utils/phone.ts`. Re-wire the processor to import from the new location. *(No dependency.)*
- **Scaffold the editor component tree.** Create `src/lib/components/features/output-editor/` with the five `.svelte` files and the `index.ts` barrel. Empty shells, no logic. *(No dependency.)*
- **Add the `Table` shadcn-svelte primitive.** Run `bunx shadcn-svelte@latest add table` and restyle to match the existing app aesthetic. *(No dependency.)*
- **Add the editor state branch to the orchestrator.** Replace the immediate `generateExcel` call in `order-processor.svelte` with mounting `<OutputEditor>` and passing it the processed rows and initial batch defaults. Remove the `acceptedFile` GIF branch. *(Depends on: scaffold; Excel writer split.)*
- **Render rows read-only.** Display the processed rows in the editor grid using the new `Table` primitive. No editing yet. Implement FR-1, FR-2, FR-3, FR-30, FR-31. *(Depends on: editor branch; Table primitive.)*
- **Implement cell editing.** Build `editor-cell.svelte` with single-click-to-edit, commit on Enter/Tab/blur, revert on Escape. Per-column input types. Keyboard navigation between cells. Implement FR-4 through FR-8, FR-32. *(Depends on: render read-only.)*
- **Implement the batch defaults strip.** Build `batch-defaults-strip.svelte` with the five fields. Wire strip → row column propagation. Implement override indicators and "Show batch columns" toggle. Implement "Reset overrides". Ensure no D1 write. Implement FR-10 through FR-14. *(Depends on: scaffold.)*
- **Implement row management.** Per-row delete and duplicate controls. "Add row" with focus management. Bulk multi-select. Undo with toast affordance. Implement FR-15, FR-16, FR-17, FR-18, FR-19. *(Depends on: render read-only.)*
- **Implement validation.** Build `validateRow`, `validatePhone`, `validateAmount` in `src/lib/utils/validate.ts`. Wire warning indicators to cells. Wire action-bar warning summary with click-to-jump. Implement FR-20 through FR-24. *(Depends on: cell editing.)*
- **Implement Download and Discard.** Wire the Download button to `writeWorkbook(buildWorkbook(currentRows), fileName)` with one-shot Phone normalization. Wire Discard with dirty-state confirmation dialog. Implement FR-25 through FR-29, NFR-13, NFR-14. *(Depends on: cell editing; Excel writer split; extract phone normalization.)*
- **Implement the action bar.** Sticky bottom bar with row count badge, warning summary, Discard, Download. Implement bulk "Delete selected" affordance for multi-select. *(Depends on: row management; validation; Download/Discard.)*
- **Accessibility pass.** Aria-labels per cell, live-region announcements for row/validation changes, touch-target sizing, focus management. Verify against VoiceOver on macOS and iOS Safari. Implement NFR-6 through NFR-10. *(Depends on: cell editing; action bar.)*
- **Mobile verification.** Confirm 16px floor on cell inputs (no iOS auto-zoom), grid horizontal scroll, defaults strip stacking, action bar pinning when keyboard is open. *(Depends on: accessibility pass.)*
- **Performance verification.** Measure NFR-1 through NFR-5 against a 500-row batch on a baseline laptop. Profile the keystroke → state → render path. If any NFR misses, add a virtualization library (`@tanstack/svelte-virtual` or equivalent) and re-measure. *(Depends on: cell editing; render read-only.)*
- **Remove the dead success-GIF path.** Delete `src/lib/components/features/download.svelte` and `src/lib/assets/download.gif` if not reused. Update the barrel export. *(Depends on: editor branch.)*

## Migration

None. The feature is additive. Users who never interact with the editor before clicking Download get the same `.xlsx` they got before. There is no data to migrate; `brand_settings` are unchanged.

## Rollback

Revert the orchestrator change in `order-processor.svelte` to re-enable the direct `generateExcel` call and remove the editor branch. The split in `excel.ts` is backward-compatible (the wrapper retains the old signature) so no other call sites break. No D1 changes means no schema rollback.

## Considered and rejected

| Alternative | Why rejected |
|---|---|
| Auto-download first, then offer an editor on a separate "history" page | Splits the operator's flow across two surfaces; defeats the spot-fix-before-send goal; reintroduces the "discover the bug after the file is gone" failure mode. |
| Open the editor in a modal dialog over the upload zone | Modals are claustrophobic for 50+ rows and the project's existing UX has zero modals — adding one would create a visual exception. The in-place swap matches the existing state-machine pattern in `order-processor.svelte`. |
| Use a heavyweight grid lib (`ag-grid-svelte`, `handsontable`, `glide-data-grid`) | All bring 100KB+ to the bundle for features (formulas, freeze panes, multi-sheet) the project doesn't need. The grid is 5 typed columns with single-cell editing — a hand-built component on shadcn-svelte primitives is correct-sized. |
| Use `react-spreadsheet` via a Svelte wrapper | The project is Svelte-only; adding React for one component is disproportionate. |
| Make the edited grid the new source-of-truth in D1 | Persisting per-batch edits adds schema, sync, and conflict-resolution surface area for a feature whose existing use case ("spot-fix then download") doesn't need it. Captured in [Future considerations](#future-considerations). |
| Run validation as a blocking gate on Download | Real-world phone exports contain edge cases (landline numbers for cash-on-delivery contacts, deliberately-empty notes) that a strict validator would flag. The user is the domain expert; warnings are advisory. |
| Auto-apply `normalizePhoneNumber` on every keystroke | Surprising mid-edit transforms (`+880` disappearing while the user is still typing) destroy trust in the editor. Normalize once on Download (NFR-14). |
| Persist edits to local storage / IndexedDB for crash recovery | Adds storage-quota, encryption-at-rest, and stale-state surface area for a flow that takes ≤ 2 minutes end-to-end. The cost of a tab crash (re-drop the CSV) is acceptable. |
| Allow re-uploading an `.xlsx` (already-processed file) back into the editor | The editor's contract is "output of the processor"; allowing arbitrary `.xlsx` upload would force schema inference and validation work that doesn't exist today. |
| Render the editor full-screen, replacing the page chrome | Violates the goal of preserving the surrounding UI/UX (header, courier picker, brand settings, footer should remain visible and reachable). |
| Use `contenteditable` instead of `<input>` for cells | Worse mobile keyboard support (`inputmode` doesn't apply), worse paste sanitization, harder to drive with arrow-key navigation, screen-reader behavior less predictable. Plain `<input>` is the right primitive. |
| Bidirectional binding between batch defaults strip and `brand_settings` (D1) | Persisting strip edits would surprise users — they want a one-off override, not a permanent change. FR-14 makes the strip explicitly session-only. |
| Render row numbers as 1-based with a leading "Row" column | Adds visual weight for low information. Use a slim hover-revealed index instead. |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Grid performance degrades on very large batches (>500 rows) | Measure against the largest realistic batch; the performance-verification piece of the work breakdown adds a virtualization library if any NFR misses. |
| Users assume edits persist across reloads, lose work to a tab close | FR-29 makes ephemerality explicit. The action bar surfaces a `Download` button prominently so the path to a durable artifact is one click away. Future consideration captures the persistence path if user feedback demands it. |
| Phone normalization on Download produces a value the user didn't expect (e.g., they typed a Bangladesh landline and didn't realize it would be reformatted) | FR-21's warning surfaces malformed phones in the cell before Download. The Download serialization is idempotent and well-tested. |
| Adding `bunx shadcn-svelte@latest add table` produces a component with style baseline conflicting with the existing app aesthetic | The added component is presentational — restyle once on add, then never touched again (per `components/ui/` convention). |
| Editor visually pushes the footer below the fold on small screens | FR-31 caps editor height at viewport fractions; the footer is reachable via internal scroll, not page scroll. Verified manually on iPhone 12 / Pixel 6 viewports during the mobile-verification piece of work. |
| Schema drift: adding new couriers introduces non-`SteadFastOrder` shapes the editor doesn't render | Editor accepts a generic `T extends object`; column metadata is supplied per courier processor. Per-courier column-type config lives next to each processor. Adding a courier means adding a column-type map, not a new editor. |
| Validation false positives push users to ignore warnings entirely | Keep the warning catalogue small (empty required, BD phone format, non-numeric amount). Resist scope creep. |
| Mobile keyboard covers the action bar on cell edit | The action bar lives outside the grid scroll container; on edit, the grid scrolls internally, the action bar pins to the editor container bottom. Verified on iOS Safari during mobile verification. |
| `XLSX.writeFile` performance regression on 1000-row batches | If a regression appears, switch to `XLSX.write` → `Blob` → `URL.createObjectURL` → `<a download>` synthetic click, which gives streaming serialization and avoids SheetJS's blocking serialization path. |

## Out of scope

- Persisting edited output to D1 or any storage.
- Real-time collaborative editing.
- Importing data from `.xlsx`, `.tsv`, JSON, clipboard.
- Per-cell change history beyond the single-action undo (FR-18).
- Find & replace across cells.
- Regex-based bulk transforms.
- Cell formulas, derived columns, computed totals.
- Column reordering, column hiding, column resizing.
- Custom number/date formatting per cell.
- Theming changes beyond reusing existing tokens.
- Localization beyond the existing English UI.
- A "history of past batches" view.
- Server-side validation or processing of edited data.

## Future considerations

- **Persist drafts.** A "Save draft" action writing the current editor state to a new `batch_drafts` D1 table, with an `/drafts` route to resume. Useful if operators need to walk away from a batch mid-edit.
- **Find & replace.** `Cmd/Ctrl+F` opens a small overlay with a find input and an optional replace input. Scoped to per-row columns.
- **Bulk paste from clipboard.** Pasting tab-separated text into a selected cell fills cells row-by-row, column-by-column. Useful for splicing in extra rows from another spreadsheet.
- **Per-cell change indicators.** A small dot in the corner of any cell that has been edited from its initial value, with a hover tooltip showing the original.
- **Per-cell history.** Multi-step undo/redo beyond the 5-second single-action window.
- **Generic editor across couriers.** Once a second courier processor exists, factor the editor's column metadata out of `SteadFastOrder`-specific assumptions and into a per-courier descriptor that the editor consumes generically.
- **Edit the source CSV before processing.** A pre-processor editor that lets the user inspect and edit the raw Shopify export rows before `CourierService.processOrders` runs. Different mental model — separate feature.
- **Compare to last batch.** A "diff vs. last download" view that flags rows whose `Phone`, `Address`, or `Name` match a previously-shipped batch (potential duplicate order across days).
- **Mobile-optimized row-edit view.** A full-screen single-row form that opens on tap, replacing the cramped horizontal scroll of the desktop grid pattern.

## Open questions

1. **Override visualization granularity.** When a row's batch-constant column diverges from the strip value, should the divergent cell get its own visual indicator in addition to the strip-level dot? Argument for: makes per-row overrides visible at a glance. Argument against: visual noise on a grid that's already dense.
2. **Undo window length.** 5 seconds matches typical toast affordances but may feel short for "I just deleted 12 rows accidentally." Should the window be longer for bulk deletes, or unbounded until the next destructive action?
3. **Add-row position.** Append-to-bottom (current FR-17 spec) is simplest. Alternative: insert below the currently-focused row, matching the duplicate-row behavior.
4. **Strip layout on narrow viewports.** Strip wraps to two columns at `sm`, single column at `xs`. Should the single-column layout collapse the strip into a disclosure ("Edit batch defaults ▾") to save vertical space, or always show all five fields?
5. **Virtualization threshold.** The row count above which virtualization is necessary is an empirical decision — measured against the largest realistic batch in the user's existing CSV exports during the performance-verification piece of work.
6. **Schema-agnostic editor vs. SteadFast-specific.** The editor implements against `SteadFastOrder` for the current courier set. The generalization to a per-courier descriptor (see [Future considerations](#future-considerations)) is deferrable until a second courier is on the roadmap — but doing it upfront has a mild upfront cost vs. mild rework later.
7. **Where the column-type metadata for SteadFast lives.** Two reasonable homes: alongside the existing processor in `src/lib/services/processors/steadfast.ts` (keeps everything courier-specific in one place), or in a new `src/lib/components/features/output-editor/columns/steadfast.ts` (keeps editor-only concerns out of the service layer).
8. **Empty-batch behavior.** FR-3 currently allows an empty editor with manual Add row. An alternative is to suppress the editor for zero-row outputs and show a "this CSV produced no orders" error. Which is the actually-useful behavior is unclear — depends on whether Shopify's CSV format ever silently emits zero-order exports in practice.
9. **Discard confirmation copy.** "Throw away your edits?" is the current FR-28 string. Open to alternatives ("Discard X edited cells?", "Return to upload — your edits will be lost?") if a sharper phrasing exists.

## Acceptance and verification

- All functional requirements FR-1 through FR-32 demonstrably pass their stated acceptance conditions against a real Shopify export of ≥ 50 rows on `bun run dev` and against the deployed Worker at `https://order-processor.beyourahi.workers.dev`.
- All non-functional thresholds NFR-1 through NFR-16 are measured and recorded; any miss triggers the corresponding mitigation in [Risks and mitigations](#risks-and-mitigations) before sign-off.
- Existing `brand_settings` round-trip is unchanged: editing the strip during a session does **not** modify the user's D1 row (FR-14 verified by reload).
- The current pre-feature download artifact (a fresh `formatted-orders-steadfast.xlsx` from an unmodified pipeline run) is byte-identical to the editor-download artifact of the same input with zero edits, verified via `shasum -a 256` on both files.
- Manual VoiceOver pass on macOS confirms cell focus announces `<column-name>, row <n>` and that row-add / row-delete actions are announced via the live region.
- iOS Safari verification confirms no auto-zoom on cell focus and that the action bar remains pinned and reachable while the on-screen keyboard is open.

/**
 * @fileoverview Changelog data — hand-curated, customer-facing product updates.
 *
 * @description
 * Single source of truth for the public `/changelog` route. Entries are written
 * in plain English for a non-technical merchant who uses the tool — never commit
 * hashes, branch names, file paths, or engineering jargon. They are derived from
 * the full git history but consolidated: chore/docs/style/refactor/merge noise is
 * dropped and related commits fold into one coherent, benefit-led entry.
 *
 * INVARIANTS
 * ──────────
 * - Newest first. The page groups by `date` and tags the single newest group
 *   "Latest"; it relies on this ordering rather than sorting at render time.
 * - `date` is an ISO `YYYY-MM-DD` string. Absolute dates only — the page never
 *   computes "x days ago" (relative dates are a hydration hazard under SSR).
 *
 * HOW TO ADD AN ENTRY
 * ───────────────────
 * Prepend a new object to `CHANGELOG_ENTRIES`, dated to the day the change ships,
 * and pick the category that best fits the user-visible effect.
 */

export type ChangelogCategory = "New feature" | "Improvement" | "Fix" | "Performance" | "Design";

export type ChangelogEntry = {
    /** ISO `YYYY-MM-DD`. Drives grouping + the "Latest" tag; keep entries newest-first. */
    date: string;
    /** Short, benefit-led, plain-language headline. */
    title: string;
    /** One to three plain-language sentences describing what changed for the merchant. */
    summary: string;
    category: ChangelogCategory;
};

// Newest first — see file header for the ordering invariant.
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        date: "2026-06-02",
        category: "Improvement",
        title: "A smarter assistant that remembers your conversations",
        summary:
            "The built-in assistant now gives sharper, more relevant answers by drawing on a built-in knowledge base about the tool. Your past chats are saved, so a conversation picks up right where you left off even after you close and reopen the app. You can talk to it in Bangla or English, whichever you prefer."
    },
    {
        date: "2026-05-25",
        category: "Improvement",
        title: "A cleaner, friendlier assistant chat",
        summary:
            "The assistant chat got a fresh, easier-to-read design with a welcome screen, a tidy message layout, and a roomier place to type. It now handles questions more gracefully and reads naturally on your phone as well as your computer."
    },
    {
        date: "2026-05-22",
        category: "Design",
        title: "Gentle motion throughout the app",
        summary:
            "Sections now ease into view, pages transition smoothly as you move around, and pop-up confirmations and warnings animate in softly instead of appearing abruptly. If you prefer less movement, the app automatically respects your device's reduced-motion setting."
    },
    {
        date: "2026-05-21",
        category: "New feature",
        title: "Edit your courier batch using plain language",
        summary:
            "A new assistant sits beside your order list and can make edits for you when you simply describe what you want — like filling in missing details or tidying up rows. It explains its changes in clear, human terms and shows friendly messages instead of confusing errors, with anything risky confirmed with you first."
    },
    {
        date: "2026-05-21",
        category: "Design",
        title: "A refreshed, more polished look",
        summary:
            "The whole app adopted a cleaner, more cohesive design with refined colors and spacing, so it feels calmer and more professional to work in day to day."
    },
    {
        date: "2026-05-20",
        category: "New feature",
        title: "Review and edit your orders before you download",
        summary:
            "You can now open your prepared courier batch in an editable table and fix anything that needs a touch-up before exporting — change a name, correct an address, or clean up a row right inside the app. The editor handles longer text neatly, shows a clear message when there is nothing to display, and works well with keyboard and screen readers."
    },
    {
        date: "2026-05-19",
        category: "Improvement",
        title: "Quick links to our other tools",
        summary:
            "The footer now links to our sister tools, including the invoice generator and the wider studio toolkit, so you can jump between them without hunting around."
    },
    {
        date: "2026-05-04",
        category: "Improvement",
        title: "Your courier settings now save themselves",
        summary:
            "Changes to your SteadFast settings now save automatically as you type, and each field shows whether it has been saved so you are never left guessing. Loading indicators and input fields look consistent across the app, and required fields make it clearer when something still needs filling in."
    },
    {
        date: "2026-05-04",
        category: "Fix",
        title: "No more accidental zooming on phones",
        summary:
            "Tapping into a field on a phone no longer zooms the page in unexpectedly, so filling in your details on mobile is much smoother."
    },
    {
        date: "2026-04-30",
        category: "Improvement",
        title: "A safer, more reliable sign-in",
        summary:
            "We added protection that limits repeated sign-in attempts to keep your account secure, and made requests across the app safer overall. Your settings are now kept privately to your own account."
    },
    {
        date: "2026-01-16",
        category: "Improvement",
        title: "A simpler, streamlined courier setup",
        summary:
            "We focused the tool on SteadFast as the default courier and removed the extra picker step, so getting from upload to a ready file is faster and less cluttered. The courier button now spans the full width for a cleaner layout."
    },
    {
        date: "2025-12-14",
        category: "New feature",
        title: "Save your brand and contact details to your account",
        summary:
            "You can now set your contact name, phone number, and merchant ID once and have them remembered for every batch. These details are tied to your account and editable any time, and a merchant ID is now required before uploading so your courier files come out complete."
    },
    {
        date: "2025-12-14",
        category: "New feature",
        title: "Sign in with Google and see your profile",
        summary:
            "You can now sign in quickly and securely with your Google account. Your profile picture appears in the app, with a tidy icon shown automatically if no picture is available."
    },
    {
        date: "2025-12-14",
        category: "Fix",
        title: "Customer city now included in courier addresses",
        summary:
            "Addresses sent to the courier now include the customer's city, so deliveries have the complete information they need."
    },
    {
        date: "2025-12-13",
        category: "Performance",
        title: "Rebuilt on a faster, more modern foundation",
        summary:
            "The app was rebuilt from the ground up on a quicker, more dependable platform. Everyday tasks feel snappier and the experience is more stable, with a refreshed sign-in screen to match."
    },
    {
        date: "2025-08-15",
        category: "Improvement",
        title: "More accurate phone numbers for courier files",
        summary:
            "Phone numbers are now cleaned up more thoroughly when preparing your SteadFast file — leading zeros are removed and common formatting quirks are corrected — so your orders are less likely to be held up by a bad number."
    },
    {
        date: "2025-08-15",
        category: "Fix",
        title: "Correctly named spreadsheet tab",
        summary:
            "The exported spreadsheet now uses a consistent, expected tab name, so it imports cleanly into the courier system without complaints."
    },
    {
        date: "2025-08-14",
        category: "New feature",
        title: "Save details for multiple brands",
        summary:
            "If you run more than one brand, the tool now supports separate brand profiles so each one keeps its own contact details ready to go."
    },
    {
        date: "2025-08-14",
        category: "Design",
        title: "A cleaner, more readable interface",
        summary:
            "We refreshed the typography and tidied up the footer for a clearer, more comfortable layout that is easier on the eyes while you work."
    },
    {
        date: "2025-05-25",
        category: "New feature",
        title: "Turn Shopify order exports into courier-ready files",
        summary:
            "The very first release: upload your Shopify order export and instantly get a tidy spreadsheet ready for your courier, with support for SteadFast and Pathao. It automatically cleans up Bangladesh phone numbers — trimming country codes and leading zeros — so your delivery files are correct from the start."
    }
];

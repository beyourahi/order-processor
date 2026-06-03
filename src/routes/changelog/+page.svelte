<script lang="ts">
    import { CHANGELOG_ENTRIES, type ChangelogEntry } from "$lib/data/changelog";
    import { reveal } from "$lib/motion";

    type ChangelogGroup = {
        date: string;
        label: string;
        entries: ChangelogEntry[];
    };

    // Absolute dates only — formatting "x days ago" client-side would mismatch the
    // server render and trip hydration (see changelog.ts header).
    const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

    function formatDate(iso: string): string {
        // Parse as UTC midnight so the displayed day never shifts by timezone.
        return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
    }

    // Entries arrive newest-first; fold consecutive same-date entries into one group
    // so each calendar day renders under a single header.
    function groupByDate(entries: ChangelogEntry[]): ChangelogGroup[] {
        const groups: ChangelogGroup[] = [];
        for (const entry of entries) {
            const last = groups.at(-1);
            if (last && last.date === entry.date) {
                last.entries.push(entry);
            } else {
                groups.push({ date: entry.date, label: formatDate(entry.date), entries: [entry] });
            }
        }
        return groups;
    }

    const groups = groupByDate(CHANGELOG_ENTRIES);
</script>

<svelte:head>
    <title>Changelog · Shopify Order Processor</title>
    <meta
        name="description"
        content="What's new in Shopify Order Processor — a plain-language history of features, improvements, and fixes."
    />
</svelte:head>

<section class="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
    <div class="flex flex-col gap-12 sm:gap-16">
        <header class="space-y-4 text-center sm:space-y-6">
            <p class="text-4xl sm:text-5xl">🗒️</p>
            <div class="space-y-1.5 sm:space-y-2">
                <h1 class="text-foreground text-2xl font-black tracking-tight text-balance sm:text-3xl lg:text-4xl">
                    Changelog
                </h1>
                <p class="text-muted-foreground text-xs sm:text-sm lg:text-base">Every update, in plain English</p>
            </div>
        </header>

        {#each groups as group, groupIndex (group.date)}
            <div class="flex flex-col gap-4 sm:gap-5">
                <div class="flex items-center gap-2">
                    <h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {group.label}
                    </h2>
                    {#if groupIndex === 0}
                        <span
                            class="border-border bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-[0.625rem] font-medium tracking-wide uppercase"
                        >
                            Latest
                        </span>
                    {/if}
                </div>

                <div class="flex flex-col gap-3 sm:gap-4">
                    {#each group.entries as entry, entryIndex (entry.title)}
                        <article
                            use:reveal={{ onScroll: true, delay: Math.min(entryIndex, 4) * 0.05 }}
                            class="border-border bg-card flex flex-col gap-2 rounded-lg border p-4 sm:p-5"
                        >
                            <span
                                class="border-border bg-muted text-muted-foreground w-fit rounded-full border px-2 py-0.5 text-xs"
                            >
                                {entry.category}
                            </span>
                            <h3 class="text-foreground font-semibold">{entry.title}</h3>
                            <p class="text-muted-foreground text-sm leading-relaxed">{entry.summary}</p>
                        </article>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</section>

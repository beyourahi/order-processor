<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { cn } from "$lib/utils";
    import { BATCH_CONSTANT_COLUMNS, type BatchDefaults } from "./columns";

    interface Props {
        defaults: BatchDefaults;
        overrideCountByColumn: Record<keyof BatchDefaults, number>;
        onUpdate: (field: keyof BatchDefaults, value: string) => void;
        onResetOverrides: (field: keyof BatchDefaults) => void;
    }

    let { defaults, overrideCountByColumn, onUpdate, onResetOverrides }: Props = $props();
</script>

<section aria-label="Batch defaults" class="border-border-strong/40 bg-surface/40 rounded-xl border p-3 sm:p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-xs font-medium tracking-wider whitespace-nowrap text-zinc-400 uppercase">Batch defaults</h2>
        <p class="text-[11px] text-pretty text-zinc-400 italic">
            Applies to every row · not saved to your brand settings
        </p>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {#each BATCH_CONSTANT_COLUMNS as column (column.key)}
            {@const fieldKey = column.key as keyof BatchDefaults}
            {@const overrides = overrideCountByColumn[fieldKey] ?? 0}
            <div class="flex flex-col">
                <div class="mb-1 flex items-center gap-1.5">
                    <label for="strip-{column.key}" class="text-[11px] font-medium text-zinc-400">
                        {column.key}
                    </label>
                    {#if overrides > 0}
                        <span
                            class="bg-courier-accent inline-block h-1.5 w-1.5 rounded-full"
                            title="{overrides} row override{overrides === 1 ? '' : 's'}"
                            aria-label="{overrides} row{overrides === 1 ? '' : 's'} have an override"
                        ></span>
                    {/if}
                </div>
                <Input
                    id="strip-{column.key}"
                    type={column.inputmode === "tel" ? "tel" : "text"}
                    value={defaults[fieldKey] ?? ""}
                    oninput={(e) => onUpdate(fieldKey, (e.currentTarget as HTMLInputElement).value)}
                    class="bg-background"
                />
                {#if overrides > 0}
                    <button
                        type="button"
                        onclick={() => onResetOverrides(fieldKey)}
                        class={cn(
                            "mt-1 cursor-pointer self-start py-2 text-[10px] whitespace-nowrap text-zinc-400 underline-offset-2 sm:py-1 pointer-fine:hover:text-zinc-200 pointer-fine:hover:underline",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        )}
                    >
                        Reset {overrides} override{overrides === 1 ? "" : "s"}
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</section>

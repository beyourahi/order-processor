<script lang="ts">
    import { COURIER_OPTIONS } from "$lib/config";
    import { cn } from "$lib/utils";

    interface Props {
        selectedCourier: string;
        onSelect: (courier: string) => void;
    }

    let { selectedCourier, onSelect }: Props = $props();
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-4 sm:gap-6">
    <div class="flex w-full flex-col gap-3 sm:gap-4">
        {#each COURIER_OPTIONS as option (option.value)}
            {@const isSelected = selectedCourier === option.value}

            <button
                onclick={() => onSelect(option.value)}
                class={cn(
                    "sleek group relative flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl p-4 sm:gap-4 sm:p-6",
                    "border transition-all duration-200",
                    "ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2",
                    isSelected
                        ? "border-courier-accent/60 bg-courier-accent/10 shadow-courier-accent/10 shadow-lg"
                        : "border-surface-raised bg-surface/40 pointer-fine:hover:border-border-strong pointer-fine:hover:bg-surface-raised/60",
                    "active:scale-[0.97]"
                )}
            >
                <!-- Selection indicator (radio style) -->
                <div
                    class={cn(
                        "absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-6 sm:w-6",
                        isSelected
                            ? "border-courier-accent bg-courier-accent"
                            : "border-zinc-600 bg-transparent pointer-fine:group-hover:border-zinc-500"
                    )}
                >
                    {#if isSelected}
                        <svg
                            aria-hidden="true"
                            class="h-3 w-3 text-white sm:h-3.5 sm:w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="3"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    {/if}
                </div>

                <!-- Courier logo -->
                <div
                    class={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl p-2 transition-all duration-200 sm:h-16 sm:w-16",
                        isSelected ? "bg-white/10" : "bg-surface-raised/50 pointer-fine:group-hover:bg-border-strong/50"
                    )}
                >
                    <img
                        src={option.logo}
                        alt={option.label}
                        class={cn(
                            "h-full w-full object-contain transition-all duration-200",
                            !isSelected && "opacity-70 pointer-fine:group-hover:opacity-100"
                        )}
                    />
                </div>

                <!-- Courier name -->
                <span
                    class={cn(
                        "text-sm font-semibold whitespace-nowrap transition-colors duration-200 sm:text-base",
                        isSelected ? "text-white" : "text-zinc-300 pointer-fine:group-hover:text-white"
                    )}
                >
                    {option.label}
                </span>
            </button>
        {/each}
    </div>
</div>

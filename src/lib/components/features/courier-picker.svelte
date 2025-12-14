<!--
  CourierPicker Component
  Premium courier selection with radio-button style indicators
  Features smooth animations and clear selection states
-->
<script lang="ts">
    import { COURIER_OPTIONS } from "$lib/config";
    import { cn } from "$lib/utils";

    interface Props {
        selectedCourier: string;
        userCourier: string | null;
        onSelect: (courier: string) => void;
    }

    let { selectedCourier, userCourier, onSelect }: Props = $props();
</script>

<div class="flex w-full flex-col items-center gap-4 sm:gap-6">
    <!-- Section header -->
    <h2 class="text-lg font-semibold tracking-tight text-white sm:text-xl">
        Choose your delivery partner
    </h2>

    <!-- Courier options grid -->
    <div class="grid w-full max-w-xs grid-cols-2 gap-3 sm:max-w-sm sm:gap-4">
        {#each COURIER_OPTIONS as option (option.value)}
            {@const isSelected = selectedCourier === option.value}
            {@const isUserCourier = userCourier === option.value}

            <button
                onclick={() => onSelect(option.value)}
                class={cn(
                    "sleek group relative flex flex-col items-center gap-3 rounded-2xl p-4 sm:gap-4 sm:p-6",
                    "border transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]",
                    isSelected
                        ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/60",
                    "active:scale-[0.97]"
                )}
            >
                <!-- Selection indicator (radio style) -->
                <div
                    class={cn(
                        "absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-6 sm:w-6",
                        isSelected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-zinc-600 bg-transparent group-hover:border-zinc-500"
                    )}
                >
                    {#if isSelected}
                        <svg class="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    {/if}
                </div>

                <!-- Courier logo -->
                <div
                    class={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl p-2 transition-all duration-200 sm:h-16 sm:w-16",
                        isSelected ? "bg-white/10" : "bg-zinc-800/50 group-hover:bg-zinc-700/50"
                    )}
                >
                    <img
                        src={option.logo}
                        alt={option.label}
                        class={cn(
                            "h-full w-full object-contain transition-all duration-200",
                            !isSelected && "opacity-70 group-hover:opacity-100"
                        )}
                    />
                </div>

                <!-- Courier name and badge -->
                <div class="flex flex-col items-center gap-1">
                    <span
                        class={cn(
                            "text-sm font-semibold transition-colors duration-200 sm:text-base",
                            isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"
                        )}
                    >
                        {option.label}
                    </span>

                    {#if isUserCourier}
                        <span
                            class={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide sm:text-xs",
                                isSelected
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-zinc-700/50 text-zinc-400"
                            )}
                        >
                            Default
                        </span>
                    {/if}
                </div>
            </button>
        {/each}
    </div>

    <!-- Helper text -->
    {#if !selectedCourier}
        <p class="mt-1 text-center text-xs text-zinc-500 sm:text-sm">
            Select a courier to enable file upload
        </p>
    {/if}
</div>

<!--
  CourierPicker Component
  Displays available courier options as buttons
  Highlights the selected courier with green ring
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

<div class="flex flex-col items-center gap-6">
    <h2 class="text-xl font-semibold text-zinc-300">Select Courier</h2>

    <div class="flex flex-wrap justify-center gap-4">
        {#each COURIER_OPTIONS as option (option.value)}
            {@const isSelected = selectedCourier === option.value}
            {@const isUserCourier = userCourier === option.value}

            <button
                onclick={() => onSelect(option.value)}
                class={cn(
                    "sleek flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    "hover:border-zinc-600 active:scale-95",
                    isSelected ? "border-green-500 bg-green-500/10" : "border-zinc-800 bg-zinc-900/50",
                    isUserCourier && !isSelected && "border-zinc-600"
                )}
            >
                <img src={option.logo} alt={option.label} class="h-12 w-12 object-contain" />
                <span class="text-sm font-medium text-zinc-300">
                    {option.label}
                </span>
                {#if isUserCourier}
                    <span class="text-xs text-zinc-500">Your default</span>
                {/if}
            </button>
        {/each}
    </div>
</div>

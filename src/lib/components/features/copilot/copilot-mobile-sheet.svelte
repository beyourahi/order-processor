<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import { copilot } from "$lib/stores/copilot.svelte";
    import { X } from "@lucide/svelte";
    import CopilotSidebar from "./copilot-sidebar.svelte";

    const close = () => copilot.setMobileOpen(false);

    const onKeydown = (event: KeyboardEvent) => {
        if (copilot.mobileOpen && event.key === "Escape") close();
    };
</script>

<svelte:window onkeydown={onKeydown} />

{#if copilot.mobileOpen}
    <div class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="AI Copilot">
        <button
            type="button"
            class="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            aria-label="Close Copilot"
            onclick={close}
            transition:fade={{ duration: 200 }}
        ></button>
        <div
            class="bg-background absolute inset-x-0 bottom-0 flex h-[100dvh] flex-col"
            transition:fly={{ y: 420, duration: 260, opacity: 1 }}
        >
            <button
                type="button"
                onclick={close}
                class="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-lg transition-colors"
                aria-label="Close Copilot"
            >
                <X class="size-5" aria-hidden="true" />
            </button>
            <CopilotSidebar bare />
        </div>
    </div>
{/if}

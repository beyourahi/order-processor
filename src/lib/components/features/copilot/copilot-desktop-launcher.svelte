<script lang="ts">
    /**
     * Floating launcher that opens the Copilot rail on desktop (`hidden lg:block`) —
     * the twin of copilot-mobile-fab. Hidden once `copilot.desktopOpen` so it never
     * sits under the open rail; clicking flips the same store flag the rail reads.
     * Mobile (<lg) uses copilot-mobile-fab + sheet instead, so the two launchers
     * never appear together.
     */
    import { copilot } from "$lib/stores/copilot.svelte";
    import CopilotLauncherIcon from "./copilot-launcher-icon.svelte";
</script>

{#if !copilot.desktopOpen}
    <div class="fixed right-5 bottom-5 z-40 hidden lg:block">
        <span class="chat-btn-ripple-ring" style="animation-delay: 0s" aria-hidden="true"></span>
        <span class="chat-btn-ripple-ring" style="animation-delay: 1.5s" aria-hidden="true"></span>
        <button
            type="button"
            onclick={() => copilot.openDesktop()}
            class="group border-chat-border bg-chat-surface hover:border-chat-text-muted hover:bg-chat-surface-hover relative z-10 flex size-14 items-center justify-center rounded-full border border-solid shadow-[var(--chat-shadow)] transition-all duration-300 ease-out active:scale-95"
            aria-label="Open AI chat"
        >
            <CopilotLauncherIcon variant="grid" class="size-6" />
        </button>
    </div>
{/if}

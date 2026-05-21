<script lang="ts">
    import { copilot } from "$lib/stores/copilot.svelte";
    import CopilotLauncherIcon from "./copilot-launcher-icon.svelte";
</script>

{#if !copilot.mobileOpen}
    <div class="fixed right-5 bottom-5 z-40 lg:hidden">
        <span class="chat-btn-ripple-ring" style="animation-delay: 0s" aria-hidden="true"></span>
        <span class="chat-btn-ripple-ring" style="animation-delay: 1.5s" aria-hidden="true"></span>
        <button
            type="button"
            onclick={() => copilot.setMobileOpen(true)}
            class="group border-border-strong/60 bg-card pointer-fine:hover:border-border-strong pointer-fine:hover:bg-muted relative z-10 flex size-14 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 ease-out active:scale-95"
            aria-label="Open AI Copilot"
        >
            <CopilotLauncherIcon variant="grid" class="size-6" />
        </button>
    </div>
{/if}

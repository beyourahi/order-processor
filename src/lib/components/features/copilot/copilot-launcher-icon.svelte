<script lang="ts">
    /**
     * The Copilot's identity mark — four squares that dance on a loop. CSS-driven
     * (see app.css `launcher-*`). `grid` is the 2×2 form used by the mobile FAB;
     * `row` is the 4-in-a-row form used in the empty state.
     */
    let { variant = "grid", class: className = "" }: { variant?: "grid" | "row"; class?: string } = $props();
</script>

{#if variant === "row"}
    <div class={`launcher-icon-row launcher-idle-row ${className}`} aria-hidden="true">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
    </div>
{:else}
    <div class={`launcher-icon launcher-idle ${className}`} aria-hidden="true">
        <div class="launcher-box-a"></div>
        <div class="launcher-box-b"></div>
        <div class="launcher-box-c"></div>
        <div class="launcher-box-d"></div>
    </div>
{/if}

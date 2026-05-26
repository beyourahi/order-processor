<script lang="ts">
    import "../app.css";
    import { page } from "$app/state";
    import { onNavigate } from "$app/navigation";
    import {
        Footer,
        CopilotSidebar,
        CopilotMobileFab,
        CopilotMobileSheet,
        CopilotConfirmDialog
    } from "$lib/components";
    import { handleViewTransition } from "$lib/motion";
    import uploadGif from "$lib/assets/upload.gif";
    import steadfastLogo from "$lib/assets/steadfast.png";

    let { children } = $props();

    onNavigate(handleViewTransition);

    // Copilot rail is scoped to "/" only — never on /login or error pages.
    const showCopilot = $derived(page.route.id === "/" && !page.error);
</script>

<svelte:head>
    <title>Shopify Order Processor</title>
    <meta name="description" content="Turn Chaos into Orders - Process Shopify exports for courier services" />
    <link rel="preload" href={uploadGif} as="image" />
    <link rel="preload" href={steadfastLogo} as="image" />
</svelte:head>

<!-- Reserves rail width + 1.5rem gutter on lg+ via --copilot-rail-width(-xl).
     CLAUDE.md warning #21: change the tokens, not hard-coded values. -->
<div
    class={[
        "flex min-h-dvh flex-col",
        showCopilot &&
            "lg:pr-[calc(var(--copilot-rail-width)+1.5rem)] xl:pr-[calc(var(--copilot-rail-width-xl)+1.5rem)]"
    ]}
>
    <main class="flex grow flex-col">
        {@render children()}
    </main>
    <Footer />
</div>

{#if showCopilot}
    <!-- p-2.5 is the inset for the card's rounded corners + shadow; the gutter
         between main content and rail is the lg:pr-* on the shell above. -->
    <aside
        class="fixed top-0 right-0 z-40 hidden h-dvh p-2.5 lg:block lg:w-[var(--copilot-rail-width)] xl:w-[var(--copilot-rail-width-xl)]"
    >
        <CopilotSidebar />
    </aside>

    <CopilotMobileFab />
    <CopilotMobileSheet />
    <CopilotConfirmDialog />
{/if}

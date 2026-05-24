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

    // The AI Copilot is app-shell furniture: a persistent right-side rail on
    // lg+, scoped to the main route so the login and error pages are untouched.
    const showCopilot = $derived(page.route.id === "/" && !page.error);
</script>

<svelte:head>
    <title>Shopify Order Processor</title>
    <meta name="description" content="Turn Chaos into Orders - Process Shopify exports for courier services" />
    <link rel="preload" href={uploadGif} as="image" />
    <link rel="preload" href={steadfastLogo} as="image" />
</svelte:head>

<!-- Left column — nav, main content and footer share its width. On lg+ it
     reserves space for the fixed Copilot rail plus a 1.5rem gutter (matches sm:px-6). -->
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
    <!-- Right rail — the Copilot, pinned to the viewport edge, full height.
         p-2.5 is the card's viewport inset (so its rounded corners and shadow
         breathe at the screen edges); the gutter between main content and the
         rail itself lives on the shell's lg:pr-* above. -->
    <aside
        class="fixed top-0 right-0 z-40 hidden h-dvh p-2.5 lg:block lg:w-[var(--copilot-rail-width)] xl:w-[var(--copilot-rail-width-xl)]"
    >
        <CopilotSidebar />
    </aside>

    <CopilotMobileFab />
    <CopilotMobileSheet />
    <CopilotConfirmDialog />
{/if}

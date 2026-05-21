<script lang="ts">
    import "../app.css";
    import { page } from "$app/state";
    import {
        Footer,
        CopilotSidebar,
        CopilotMobileFab,
        CopilotMobileSheet,
        CopilotConfirmDialog
    } from "$lib/components";
    import uploadGif from "$lib/assets/upload.gif";
    import steadfastLogo from "$lib/assets/steadfast.png";

    let { children } = $props();

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
     reserves space for the fixed Copilot rail via padding-right. -->
<div class={["flex min-h-dvh flex-col", showCopilot && "lg:pr-[26rem] xl:pr-[28rem]"]}>
    <main class="flex grow flex-col">
        {@render children()}
    </main>
    <Footer />
</div>

{#if showCopilot}
    <!-- Right rail — the Copilot, pinned to the viewport edge, full height. -->
    <aside class="fixed top-0 right-0 z-40 hidden h-dvh p-2.5 lg:block lg:w-[26rem] xl:w-[28rem]">
        <CopilotSidebar />
    </aside>

    <CopilotMobileFab />
    <CopilotMobileSheet />
    <CopilotConfirmDialog />
{/if}

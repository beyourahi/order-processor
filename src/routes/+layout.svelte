<!--
  Root Layout
  Provides the app shell with global styles and footer
-->
<script lang="ts">
    import "../app.css";
    import { Footer } from "$lib/components";

    let { children } = $props();
</script>

<svelte:head>
    <title>Shopify Order Processor</title>
    <meta name="description" content="Turn Chaos into Orders - Process Shopify exports for courier services" />
    <!-- Preload critical images -->
    <link rel="preload" href="/upload.gif" as="image" />
    <link rel="preload" href="/pathao.png" as="image" />
    <link rel="preload" href="/steadfast.png" as="image" />
</svelte:head>

<div class="flex min-h-screen flex-col">
    <main class="flex grow flex-col">
        {@render children()}
    </main>
    <Footer />
</div>

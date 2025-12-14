<!--
  Root Layout
  Provides the app shell with global styles and footer
-->
<script lang="ts">
    import "../app.css";
    import { Footer } from "$lib/components";
    import uploadGif from "$lib/assets/upload.gif";
    import pathaoLogo from "$lib/assets/pathao.png";
    import steadfastLogo from "$lib/assets/steadfast.png";

    let { children } = $props();
</script>

<svelte:head>
    <title>Shopify Order Processor</title>
    <meta name="description" content="Turn Chaos into Orders - Process Shopify exports for courier services" />
    <!-- Preload critical images -->
    <link rel="preload" href={uploadGif} as="image" />
    <link rel="preload" href={pathaoLogo} as="image" />
    <link rel="preload" href={steadfastLogo} as="image" />
</svelte:head>

<div class="flex min-h-dvh flex-col">
    <main class="flex grow flex-col">
        {@render children()}
    </main>
    <Footer />
</div>

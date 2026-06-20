<script lang="ts">
    import { untrack, onMount } from "svelte";
    import { courierService, brandSettings } from "$lib/stores";
    import { copilot } from "$lib/stores/copilot.svelte";
    import { Heading, OrderProcessor, CourierPicker, User, SignInButton, SteadFastSettings } from "$lib/components";
    import { reveal } from "$lib/motion";
    import { Courier } from "$lib/types";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // CRITICAL: synchronous hydration via untrack(). DO NOT move into $effect
    // — children read brandSettings during their own mount, and an $effect race
    // left inputs blank until after first render (fixed in commit 6d9d68b).
    // For guests the server state is empty; the real local state loads in onMount
    // (localStorage is browser-only). `authed` routes future writes to D1 vs local.
    untrack(() => {
        brandSettings.hydrate(data.brandSettings, { authed: !!data.user });
        copilot.hydrate(data.copilotConversations);
    });

    // Browser-only persistence bridge: authed → import any prior guest settings
    // into the account once; guest → re-seed the store from localStorage.
    onMount(() => {
        if (data.user) void brandSettings.migrateGuestToServer();
        else brandSettings.loadGuest();
    });

    const showSteadFastSettings = $derived(courierService.value === Courier.SteadFast);

    // bind:editorOpen — true while output-editor replaces the dropzone.
    // Drives the outer layout: editor gets full width; picker + settings stack on top.
    let editorOpen = $state(false);

    const handleCourierSelect = (courier: string) => {
        courierService.setSelected(courier);
    };
</script>

<!-- Left column of the layout; Copilot rail is mounted by +layout.svelte.
     `reveal` is GSAP-backed and respects prefers-reduced-motion. -->
<div class="flex w-full grow flex-col px-[var(--content-x)] py-8">
    <!-- Not wrapped in reveal: these are position:fixed, and a transform on any
         ancestor would re-anchor them relative to that ancestor, not the viewport.
         Signed in → profile + sign-out; guest → invitation to sign in. -->
    {#if data.user && data.currentUser}
        <User user={data.user} currentUser={data.currentUser} />
    {:else}
        <SignInButton />
    {/if}

    <div class="m-auto flex w-full flex-col items-center gap-12 sm:gap-16 lg:items-stretch lg:gap-16">
        <div use:reveal={{ distance: "sm", delay: 0 }}>
            <Heading />
        </div>

        <div
            class={[
                "flex w-full max-w-md items-center justify-center gap-8 sm:max-w-xl sm:gap-10",
                editorOpen ? "flex-col lg:max-w-none" : "flex-col-reverse lg:max-w-none lg:flex-row lg:gap-12"
            ]}
        >
            <div use:reveal={{ distance: "sm", delay: 0.1 }} class="flex w-full justify-center lg:block">
                <OrderProcessor currentUser={data.currentUser} selectedCourier={courierService.value} bind:editorOpen />
            </div>

            <div
                class={[
                    "flex w-full flex-col items-center gap-6",
                    editorOpen && "lg:flex-row lg:items-start lg:justify-center lg:gap-8"
                ]}
            >
                <div use:reveal={{ distance: "sm", delay: 0.15, onScroll: true }} class="flex w-full justify-center">
                    <CourierPicker selectedCourier={courierService.value} onSelect={handleCourierSelect} />
                </div>
                {#if showSteadFastSettings}
                    <div use:reveal={{ distance: "sm", delay: 0.2, onScroll: true }} class="flex w-full justify-center">
                        <SteadFastSettings visible />
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<script lang="ts">
    import { untrack } from "svelte";
    import { courierService, brandSettings } from "$lib/stores";
    import { Heading, OrderProcessor, CourierPicker, User, SteadFastSettings } from "$lib/components";
    import { reveal } from "$lib/motion";
    import { Courier } from "$lib/types";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // Hydrate the store synchronously during setup so children read canonical
    // server values during their own mount — fixes the previous $effect-based
    // race that left inputs empty until after first render.
    untrack(() => {
        brandSettings.hydrate(data.brandSettings);
    });

    const showSteadFastSettings = $derived(courierService.value === Courier.SteadFast);

    // Bound by OrderProcessor — true while the output editor is mounted in
    // place of the upload zone. Drives the outer layout: when the editor is
    // open, picker + settings stack above it so the editor gets full width.
    let editorOpen = $state(false);

    const handleCourierSelect = (courier: string) => {
        courierService.setSelected(courier);
    };
</script>

<!-- The order-processing tool. It occupies the left column; the AI Copilot
     rail is mounted by the app shell (+layout.svelte). On mount the regions
     cascade in via the GSAP-backed `reveal` action (reduced-motion aware). -->
<div class="flex w-full grow flex-col items-center justify-center gap-12 px-4 py-6 sm:gap-16 sm:py-8 lg:gap-20">
    <div use:reveal={{ distance: "sm", delay: 0 }}>
        <Heading />
    </div>

    <!-- User is a fixed-position corner menu; a `transform` from `reveal` on an
         ancestor would re-anchor the fixed child, so it is intentionally not
         wrapped. It keeps its own existing entrance behaviour. -->
    <User user={data.user!} currentUser={data.currentUser!} />

    <div
        class={[
            "flex w-full max-w-md items-center justify-center gap-8 sm:max-w-xl sm:gap-10",
            editorOpen
                ? "flex-col lg:max-w-5xl xl:max-w-6xl"
                : "flex-col-reverse lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl"
        ]}
    >
        <div use:reveal={{ distance: "sm", delay: 0.1 }} class="flex w-full justify-center">
            <OrderProcessor currentUser={data.currentUser!} selectedCourier={courierService.value} bind:editorOpen />
        </div>

        <div
            class={[
                "flex w-full flex-col items-center gap-6",
                editorOpen && "lg:flex-row lg:items-start lg:justify-center lg:gap-8 xl:max-w-5xl"
            ]}
        >
            <div use:reveal={{ distance: "sm", delay: 0.15, onScroll: true }} class="flex w-full justify-center">
                <CourierPicker selectedCourier={courierService.value} onSelect={handleCourierSelect} />
            </div>
            <div use:reveal={{ distance: "sm", delay: 0.2, onScroll: true }} class="flex w-full justify-center">
                <SteadFastSettings visible={showSteadFastSettings} />
            </div>
        </div>
    </div>
</div>

<script lang="ts">
    import { untrack } from "svelte";
    import { courierService, brandSettings } from "$lib/stores";
    import {
        Heading,
        OrderProcessor,
        CourierPicker,
        User,
        SteadFastSettings,
        CopilotSidebar,
        CopilotMobileFab,
        CopilotMobileSheet,
        CopilotConfirmDialog
    } from "$lib/components";
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

<!-- Two-pane on lg+: the order-processing tool on the left, the always-on AI
     Copilot docked on the right. Below lg the Copilot collapses to a FAB. -->
<div class="flex w-full grow flex-col lg:flex-row">
    <div class="flex grow flex-col items-center justify-center gap-12 px-4 py-6 sm:gap-16 sm:py-8 lg:gap-20">
        <Heading />

        <User user={data.user!} currentUser={data.currentUser!} />

        <div
            class={[
                "flex w-full max-w-md items-center justify-center gap-8 sm:max-w-xl sm:gap-10",
                editorOpen
                    ? "flex-col lg:max-w-5xl xl:max-w-6xl"
                    : "flex-col-reverse lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl"
            ]}
        >
            <OrderProcessor currentUser={data.currentUser!} selectedCourier={courierService.value} bind:editorOpen />

            <div
                class={[
                    "flex w-full flex-col items-center gap-6",
                    editorOpen && "lg:flex-row lg:items-start lg:justify-center lg:gap-8 xl:max-w-5xl"
                ]}
            >
                <CourierPicker selectedCourier={courierService.value} onSelect={handleCourierSelect} />
                <SteadFastSettings visible={showSteadFastSettings} />
            </div>
        </div>
    </div>

    <aside class="hidden shrink-0 lg:block lg:w-[26rem] xl:w-[28rem]">
        <div class="sticky top-0 h-dvh p-2.5">
            <CopilotSidebar />
        </div>
    </aside>
</div>

<CopilotMobileFab />
<CopilotMobileSheet />
<CopilotConfirmDialog />

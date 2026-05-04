<script lang="ts">
    import { untrack } from "svelte";
    import { courierService, brandSettings } from "$lib/stores";
    import { Heading, OrderProcessor, CourierPicker, User, SteadFastSettings } from "$lib/components";
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

    const handleCourierSelect = (courier: string) => {
        courierService.setSelected(courier);
    };
</script>

<div class="flex w-full grow flex-col items-center justify-center gap-12 px-4 py-6 sm:gap-16 sm:py-8 lg:gap-20">
    <Heading />

    <User user={data.user!} currentUser={data.currentUser!} />

    <div
        class="flex w-full max-w-md flex-col-reverse items-center justify-center gap-8 sm:max-w-xl sm:gap-10 lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl"
    >
        <OrderProcessor currentUser={data.currentUser!} selectedCourier={courierService.value} />

        <div class="flex w-full flex-col items-center gap-6">
            <CourierPicker selectedCourier={courierService.value} onSelect={handleCourierSelect} />
            <SteadFastSettings visible={showSteadFastSettings} />
        </div>
    </div>
</div>

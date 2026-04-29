<!--
  Main Page
  The primary application interface for authenticated users
  Unauthenticated users are redirected to /login server-side
-->
<script lang="ts">
    import { page } from "$app/state";
    import { courierService } from "$lib/stores";
    import { Heading, OrderProcessor, CourierPicker, User, SteadFastSettings } from "$lib/components";

    // Get data from server load (user is guaranteed to exist due to server redirect)
    const user = $derived(page.data.user);
    const currentUser = $derived(page.data.currentUser);

    // Show SteadFast settings when that courier is selected
    const showSteadFastSettings = $derived($courierService === "SteadFast");

    // Handle courier selection
    const handleCourierSelect = (courier: string) => {
        courierService.set(courier);
    };
</script>

<div class="flex w-full grow flex-col items-center justify-center gap-12 px-4 py-6 sm:gap-16 sm:py-8 lg:gap-20">
    <Heading />

    <!-- User is always authenticated here due to server redirect -->
    <User user={user!} currentUser={currentUser!} />

    <div
        class="flex w-full max-w-md flex-col-reverse items-center justify-center gap-8 sm:max-w-xl sm:gap-10 lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl"
    >
        <OrderProcessor currentUser={currentUser!} selectedCourier={$courierService} />

        <!-- Courier picker with optional settings -->
        <div class="flex w-full flex-col items-center gap-6">
            <CourierPicker selectedCourier={$courierService} onSelect={handleCourierSelect} />
            <SteadFastSettings visible={showSteadFastSettings} />
        </div>
    </div>
</div>

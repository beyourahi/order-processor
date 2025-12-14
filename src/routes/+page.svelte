<!--
  Main Page
  The primary application interface for authenticated users
  Unauthenticated users are redirected to /login server-side
-->
<script lang="ts">
    import { page } from "$app/state";
    import { courierService } from "$lib/stores";
    import { Heading, NotAuthorized, OrderProcessor, CourierPicker, User } from "$lib/components";

    // Get data from server load (user is guaranteed to exist due to server redirect)
    const user = $derived(page.data.user);
    const currentUser = $derived(page.data.currentUser);

    // Handle courier selection
    const handleCourierSelect = (courier: string) => {
        courierService.set(courier);
    };
</script>

<div class="flex w-full grow flex-col items-center justify-center gap-12 px-4 py-6 sm:gap-16 sm:py-8 lg:gap-20">
    <Heading />

    <!-- Authentication states (user is always present due to server redirect) -->
    {#if !currentUser}
        <!-- Logged in but not authorized (email not in allowlist) -->
        <NotAuthorized />
    {:else}
        <!-- Authorized user - show main interface -->
        <!-- Floating user badge (fixed position) -->
        <User user={user!} currentUser={currentUser!} />

        <div
            class="flex w-full max-w-md flex-col-reverse items-center justify-center gap-8 sm:max-w-xl sm:gap-10 lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl"
        >
            <OrderProcessor {currentUser} selectedCourier={$courierService} />

            <CourierPicker selectedCourier={$courierService} onSelect={handleCourierSelect} />
        </div>
    {/if}
</div>

<!--
  Main Page
  The primary application interface with authentication check
-->
<script lang="ts">
    import { page } from "$app/state";
    import { authClient } from "$lib/auth-client";
    import { courierService } from "$lib/stores";
    import { Heading, LoadingSpinner, NotAuthorized, OrderProcessor, CourierPicker, User } from "$lib/components";
    import { isEmailAuthorized } from "$lib/hooks";

    // Get data from layout load
    const user = $derived(page.data.user);
    const currentUser = $derived(page.data.currentUser);

    // Check authorization
    const isAuthorized = $derived(isEmailAuthorized(user?.email));

    // Session state from client
    const session = authClient.useSession();

    // Handle courier selection
    const handleCourierSelect = (courier: string) => {
        courierService.set(courier);
    };
</script>

<div class="flex w-full grow flex-col items-center justify-center gap-20 px-4 pt-4 xl:pt-8">
    <Heading />

    <!-- Three-state authentication flow -->
    {#if $session.isPending}
        <!-- Loading state -->
        <LoadingSpinner />
    {:else if !user}
        <!-- Not logged in - redirect to login -->
        <div class="flex flex-col items-center gap-4">
            <p class="text-zinc-400">Please sign in to continue</p>
            <a
                href="/login"
                class="sleek rounded-xl bg-white px-8 py-3 text-sm font-medium text-black active:scale-95 xl:hover:bg-white/90"
            >
                Sign In
            </a>
        </div>
    {:else if !isAuthorized}
        <!-- Logged in but not authorized -->
        <NotAuthorized />
    {:else if currentUser}
        <!-- Authorized user - show main interface -->
        <div class="flex w-full flex-col items-center gap-20 text-center">
            <div
                class="flex w-full max-w-xl flex-col-reverse items-center justify-center gap-12 lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl"
            >
                <OrderProcessor {currentUser} selectedCourier={$courierService} />

                <CourierPicker
                    selectedCourier={$courierService}
                    userCourier={currentUser.courier}
                    onSelect={handleCourierSelect}
                />
            </div>

            <User {user} {currentUser} />
        </div>
    {:else}
        <!-- Fallback loading -->
        <LoadingSpinner />
    {/if}
</div>

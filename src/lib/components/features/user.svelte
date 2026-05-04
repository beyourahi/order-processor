<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/utils";
    import { LoadingSpinner } from "$lib/components";
    import type { CurrentUser } from "$lib/types";

    interface Props {
        user: {
            email: string;
            name: string;
            image?: string | null | undefined;
        };
        currentUser: CurrentUser;
    }

    let { user, currentUser }: Props = $props();

    let isLoggingOut = $state(false);
    let showTooltip = $state(false);
    let expanded = $state(false);

    const handleLogout = async () => {
        isLoggingOut = true;
        try {
            await authClient.signOut();
            goto("/login");
        } finally {
            isLoggingOut = false;
        }
    };
</script>

<div class="fixed top-4 right-4 z-50 flex items-center gap-2 sm:top-6 sm:right-6">
    <div
        class="group relative flex items-center"
        role="group"
        aria-label="User profile"
        onmouseenter={() => (expanded = true)}
        onmouseleave={() => (expanded = false)}
    >
        <div
            tabindex="0"
            role="button"
            onfocus={() => (expanded = true)}
            onblur={() => (expanded = false)}
            class={cn(
                "sleek relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 sm:h-10 sm:w-10",
                "border-border-strong/50 bg-surface-raised/90 border text-zinc-300 backdrop-blur-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                user.image && "overflow-hidden p-0"
            )}
            aria-label={currentUser.name}
        >
            {#if user.image}
                <img src={user.image} alt={user.name} class="h-full w-full object-cover" referrerpolicy="no-referrer" />
            {:else}
                <svg
                    aria-hidden="true"
                    class="h-4 w-4 sm:h-5 sm:w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            {/if}
        </div>

        <div
            class={cn(
                "border-border-strong/50 bg-surface-raised/90 absolute right-0 flex h-9 items-center overflow-hidden rounded-full border whitespace-nowrap backdrop-blur-sm transition-all duration-300 sm:h-10",
                expanded ? "w-auto pr-11 pl-3 opacity-100 sm:pr-12" : "w-0 pr-0 pl-0 opacity-0"
            )}
        >
            <div class="flex flex-col justify-center">
                <span class="text-xs leading-tight font-medium text-zinc-200 sm:text-sm">
                    {currentUser.name}
                </span>
                <span class="text-xs leading-tight text-zinc-500">
                    {user.email}
                </span>
            </div>
        </div>
    </div>

    <div class="relative">
        <button
            onclick={handleLogout}
            disabled={isLoggingOut}
            onmouseenter={() => (showTooltip = true)}
            onmouseleave={() => (showTooltip = false)}
            onfocus={() => (showTooltip = true)}
            onblur={() => (showTooltip = false)}
            aria-label="Sign out"
            class={cn(
                "sleek group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200 sm:h-10 sm:w-10",
                "focus-visible:ring-destructive/50 focus:outline-none focus-visible:ring-2",
                isLoggingOut
                    ? "border-border-strong bg-surface-raised/90 cursor-wait"
                    : "border-destructive/40 bg-destructive/10 hover:border-destructive hover:bg-destructive active:scale-95"
            )}
        >
            {#if isLoggingOut}
                <LoadingSpinner size="sm" />
            {:else}
                <svg
                    aria-hidden="true"
                    class="text-destructive h-4 w-4 transition-colors group-hover:text-white sm:h-4.5 sm:w-4.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                    <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
            {/if}
        </button>

        {#if showTooltip && !isLoggingOut}
            <div
                class="bg-surface-raised absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-zinc-200 shadow-lg"
                role="tooltip"
            >
                Sign out
                <div
                    class="border-b-surface-raised absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                ></div>
            </div>
        {/if}
    </div>
</div>

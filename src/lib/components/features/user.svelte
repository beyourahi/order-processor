<!--
  User Component
  Floating user badge with avatar and power button logout
  Fixed position in top-right corner for minimal, elegant design
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/utils";
    import type { CurrentUser } from "$lib/types";

    interface Props {
        user: {
            email: string;
            name: string;
        };
        currentUser: CurrentUser;
    }

    let { user, currentUser }: Props = $props();

    let isLoggingOut = $state(false);
    let showTooltip = $state(false);
    let expanded = $state(false);

    // Get user initials for avatar
    const initials = $derived((currentUser.name?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase());

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

<!-- Fixed floating container -->
<div class="fixed top-4 right-4 z-50 flex items-center gap-2 sm:top-6 sm:right-6">
    <!-- User info (expandable on hover/focus) -->
    <div
        class="group relative flex items-center"
        onmouseenter={() => (expanded = true)}
        onmouseleave={() => (expanded = false)}
    >
        <!-- Avatar -->
        <a
            href={currentUser.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onfocus={() => (expanded = true)}
            onblur={() => (expanded = false)}
            class={cn(
                "sleek relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 sm:h-10 sm:w-10",
                "border border-zinc-700/50 bg-zinc-800/90 text-zinc-300 backdrop-blur-sm",
                "hover:border-zinc-600 hover:bg-zinc-700 hover:text-white",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            )}
            aria-label="Visit {currentUser.name}"
        >
            {initials}
        </a>

        <!-- Expandable name badge -->
        <div
            class={cn(
                "absolute right-0 flex items-center overflow-hidden rounded-full border border-zinc-700/50 bg-zinc-800/90 whitespace-nowrap backdrop-blur-sm transition-all duration-300",
                expanded ? "w-auto pr-11 pl-3 opacity-100 sm:pr-12" : "w-0 pr-0 pl-0 opacity-0"
            )}
            style="height: 2.25rem;"
        >
            <div class="flex flex-col justify-center">
                <span class="text-xs leading-tight font-medium text-zinc-200 sm:text-sm">
                    {currentUser.name}
                </span>
                <span class="text-[10px] leading-tight text-zinc-500 sm:text-xs">
                    {user.email}
                </span>
            </div>
        </div>
    </div>

    <!-- Power button -->
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
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
                isLoggingOut
                    ? "cursor-wait border-zinc-700 bg-zinc-800/90"
                    : "border-red-500/40 bg-red-500/10 hover:border-red-500 hover:bg-red-500 active:scale-95"
            )}
        >
            {#if isLoggingOut}
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"></div>
            {:else}
                <svg
                    class="h-4 w-4 text-red-400 transition-colors group-hover:text-white sm:h-4.5 sm:w-4.5"
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

        <!-- Tooltip -->
        {#if showTooltip && !isLoggingOut}
            <div
                class="absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-zinc-200 shadow-lg"
                role="tooltip"
            >
                Sign out
                <div
                    class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-800"
                ></div>
            </div>
        {/if}
    </div>
</div>

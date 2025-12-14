<!--
  User Component
  Displays current user info and logout button
  Shows brand name, email, and link to brand URL with responsive layout
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
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

<div
    class="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-4 text-zinc-400 sm:max-w-xl sm:gap-6 sm:p-6 md:flex-row md:justify-between lg:max-w-4xl lg:p-8 2xl:max-w-6xl"
>
    <!-- User info section -->
    <div
        class="flex w-full flex-col items-center gap-2 text-center text-xs sm:items-start sm:text-left sm:text-sm md:w-auto"
    >
        <span class="flex gap-0.5 sm:gap-1.5">
            <span class="text-zinc-500">Name:</span>
            <a
                href={currentUser.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                class="sleek font-semibold text-zinc-300 active:text-zinc-400 xl:hover:text-white"
            >
                {currentUser.name}
            </a>
        </span>

        <span class="flex gap-0.5 sm:gap-1.5">
            <span class="text-zinc-500">Email:</span>
            <a
                href={`mailto:${user.email}`}
                class="sleek max-w-50 truncate font-semibold text-zinc-300 active:text-zinc-400 sm:max-w-none xl:hover:text-white"
            >
                {user.email}
            </a>
        </span>
    </div>

    <!-- Logout button -->
    <button
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="sleek w-full rounded-xl bg-red-500/90 px-8 py-2.5 text-xs font-semibold tracking-wide text-white uppercase active:scale-95 active:bg-red-700 disabled:opacity-50 sm:w-auto sm:px-10 sm:py-3 sm:text-sm xl:hover:bg-red-600"
    >
        {isLoggingOut ? "Logging out..." : "Log Out"}
    </button>
</div>

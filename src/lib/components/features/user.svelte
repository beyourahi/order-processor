<!--
  User Component
  Displays current user info and logout button
  Shows brand name, email, and link to brand URL
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
    class="flex w-full flex-col gap-8 text-zinc-400 sm:max-w-xl sm:items-center sm:gap-16 md:flex-row md:justify-between lg:max-w-4xl 2xl:max-w-6xl"
>
    <div class="flex flex-col items-start gap-2 text-sm">
        <span>
            Name:
            <a
                href={currentUser.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                class="sleek font-bold text-zinc-300 active:text-zinc-400 xl:hover:text-zinc-400"
            >
                {currentUser.name}
            </a>
        </span>

        <span>
            E-mail:
            <a
                href={currentUser.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                class="sleek font-bold text-zinc-300 active:text-zinc-400 xl:hover:text-zinc-400"
            >
                {user.email}
            </a>
        </span>
    </div>

    <button
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="sleek rounded-xl bg-red-500 px-12 py-3 text-sm font-bold text-white uppercase active:scale-95 active:bg-red-700 disabled:opacity-50 xl:hover:bg-red-700"
    >
        {isLoggingOut ? "Logging out..." : "Log Out"}
    </button>
</div>

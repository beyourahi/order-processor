<!--
  NotAuthorized Component
  Shows when user is authenticated but not in allowlist.
  Displays the user's email and provides a way to sign out
  with responsive styling across all breakpoints
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";

    // Get user from page data (provided by +page.server.ts)
    const user = $derived(page.data.user);

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

<div class="flex flex-col items-center gap-6 px-4 text-center sm:gap-8">
    <div class="flex flex-col gap-3 sm:gap-4">
        <p class="text-4xl sm:text-5xl">🔒</p>
        <h2 class="text-xl font-bold text-red-500 sm:text-2xl">Access Denied</h2>
        <p class="max-w-xs text-sm text-zinc-400 sm:max-w-md sm:text-base">
            The email address
            <span class="break-all font-medium text-zinc-300">{user?.email}</span>
            is not authorized to access this application.
        </p>
        <p class="text-xs text-zinc-500 sm:text-sm">
            Please contact the administrator if you believe this is an error.
        </p>
    </div>

    <button
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="sleek w-full max-w-xs rounded-xl bg-zinc-800 px-6 py-2.5 text-xs font-medium text-white active:scale-95 disabled:opacity-50 sm:w-auto sm:px-8 sm:py-3 sm:text-sm xl:hover:bg-zinc-700"
    >
        {isLoggingOut ? "Signing out..." : "Sign in with a different account"}
    </button>
</div>

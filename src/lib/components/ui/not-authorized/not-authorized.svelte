<!--
  NotAuthorized Component
  Shows when user is authenticated but not in allowlist.

  Displays the user's email and provides a way to sign out
  and try with a different account.
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

<div class="flex flex-col items-center gap-8 text-center">
    <div class="flex flex-col gap-4">
        <p class="text-5xl">🔒</p>
        <h2 class="text-2xl font-bold text-red-500">Access Denied</h2>
        <p class="max-w-md text-zinc-400">
            The email address
            <span class="font-medium text-zinc-300">{user?.email}</span>
            is not authorized to access this application.
        </p>
        <p class="text-sm text-zinc-500">Please contact the administrator if you believe this is an error.</p>
    </div>

    <button
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="sleek rounded-xl bg-zinc-800 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
    >
        {isLoggingOut ? "Signing out..." : "Sign in with a different account"}
    </button>
</div>

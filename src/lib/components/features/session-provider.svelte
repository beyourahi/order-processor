<!--
  Session Provider
  Handles session refresh to keep auth state fresh.

  This component periodically refreshes the session to prevent
  stale session data. Better Auth's session cache is 5 minutes,
  so we refresh every 4 minutes to stay ahead.

  Usage: Wrap your app content with this in +layout.svelte
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import type { Snippet } from "svelte";

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();

    // Refresh session periodically to prevent stale data
    $effect(() => {
        // Refresh every 4 minutes (session cache is 5 minutes)
        const id = setInterval(
            () => {
                authClient.useSession();
            },
            4 * 60 * 1000
        );

        return () => clearInterval(id);
    });
</script>

{@render children()}

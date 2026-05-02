<!--
  Error Page
  Displays when an error occurs during navigation or data loading
-->
<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components";

    const handleReset = () => {
        goto("/");
    };
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-8 p-4">
    <div class="flex flex-col items-center gap-4 text-center">
        <p class="text-destructive text-6xl font-bold" aria-label="HTTP status code {page.status}">
            {page.status}
        </p>
        <h1 class="text-2xl font-semibold text-zinc-300">
            {page.error?.message || "Something went wrong"}
        </h1>
        <p class="max-w-md text-zinc-400">
            An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
    </div>

    <Button onclick={handleReset} variant="outline">Go back home</Button>
</div>

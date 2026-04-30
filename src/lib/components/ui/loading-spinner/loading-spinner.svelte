<!--
  LoadingSpinner Component
  Displays an animated loading indicator using Tailwind's animate-spin
  Supports size variants (sm, md, lg) and a configurable border-top color class
-->
<script lang="ts">
    import { cn } from "$lib/utils";

    type Size = "sm" | "md" | "lg";

    interface Props {
        size?: Size;
        colorClass?: string;
        class?: string;
    }

    const sizeClasses: Record<Size, string> = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6"
    };

    let { size = "md", colorClass = "border-t-zinc-400", class: className = "" }: Props = $props();
</script>

<div
    class={cn("animate-spin rounded-full border-2 border-zinc-500", sizeClasses[size], colorClass, className)}
    role="status"
    aria-label="Loading"
>
    <span class="sr-only">Loading...</span>
</div>

<style>
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>

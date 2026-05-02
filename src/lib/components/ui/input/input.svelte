<!--
  Input Component
  A styled text input with error state, focus ring, and disabled state support.
  Supports bind:value via $bindable().
-->
<script lang="ts">
    import { cn } from "$lib/utils";

    interface Props {
        value?: string;
        placeholder?: string;
        disabled?: boolean;
        error?: boolean;
        class?: string;
        id?: string;
        type?: string;
        oninput?: (e: Event) => void;
    }

    let {
        value = $bindable(""),
        placeholder,
        disabled,
        error,
        class: className,
        id,
        type = "text",
        oninput
    }: Props = $props();
</script>

<input
    {id}
    {type}
    {placeholder}
    {disabled}
    {oninput}
    bind:value
    class={cn(
        "bg-surface w-full rounded-lg border px-3 py-2 text-sm text-zinc-200 transition-colors placeholder:text-zinc-500",
        "focus-visible:ring-courier-accent/50 focus-visible:ring-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-destructive/50" : "border-border-strong/50",
        className
    )}
/>

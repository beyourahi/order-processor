<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement> = $props();
</script>

<tr
    bind:this={ref}
    data-slot="table-row"
    class={cn(
        "border-border-strong/40 hover:bg-surface/40 data-[state=selected]:bg-surface-raised/60 border-b transition-colors",
        className
    )}
    {...restProps}
>
    {@render children?.()}
</tr>

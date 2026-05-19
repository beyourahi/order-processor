<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils";
    import type { HTMLTdAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLTdAttributes, HTMLTableCellElement> = $props();
</script>

<td
    bind:this={ref}
    data-slot="table-cell"
    class={cn("p-2 align-middle whitespace-nowrap text-white/90 [&:has([role=checkbox])]:pr-0", className)}
    {...restProps}
>
    {@render children?.()}
</td>

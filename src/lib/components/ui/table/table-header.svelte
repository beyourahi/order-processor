<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement> = $props();
</script>

<thead
    bind:this={ref}
    data-slot="table-header"
    class={cn("bg-surface/40 [&_tr]:border-border-strong/50 [&_tr]:border-b", className)}
    {...restProps}
>
    {@render children?.()}
</thead>

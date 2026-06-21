<!--
    Custom Select — bits-ui (type single) styled to the Dropout DS.

    A self-contained, single-file wrapper: the trigger matches `inputBase`
    (border-hair, hover/focus rings), the panel is a portalled bg-card surface
    with a soft shadow and Check on the selected item. Keyboard nav, focus
    management, and the hidden form input (via the `name` prop) come from bits-ui.

    The accent (signal) is applied ONLY to the selected item's check + label,
    never to the resting surface — honoring the monochrome black-first law.

    Open/close motion is gated behind `motion-safe:` so prefers-reduced-motion
    users get an instant snap with no animation.
-->
<script lang="ts">
    import { Select as SelectPrimitive } from "bits-ui";
    import Check from "@lucide/svelte/icons/check";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import { cn } from "$lib/utils";
    import { inputBase } from "$lib/ds";

    export type SelectOption = {
        value: string;
        label: string;
        disabled?: boolean;
    };

    interface Props {
        value: string;
        options: readonly SelectOption[];
        name?: string;
        id?: string;
        disabled?: boolean;
        placeholder?: string;
        contentClass?: string;
        triggerClass?: string;
        "aria-label"?: string;
        "aria-labelledby"?: string;
    }

    let {
        value = $bindable(),
        options,
        name,
        id,
        disabled = false,
        placeholder = "Select…",
        contentClass,
        triggerClass,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledby
    }: Props = $props();

    const selectedLabel = $derived(options.find((opt) => opt.value === value)?.label ?? "");

    // exactOptionalPropertyTypes: only forward optional props when defined, so
    // we never hand bits-ui `undefined` for a key it types as required-when-present.
    const rootProps = $derived(name === undefined ? {} : { name });
    const triggerProps = $derived({
        ...(id === undefined ? {} : { id }),
        ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel }),
        ...(ariaLabelledby === undefined ? {} : { "aria-labelledby": ariaLabelledby })
    });
</script>

<SelectPrimitive.Root type="single" {disabled} bind:value {...rootProps}>
    <SelectPrimitive.Trigger
        {...triggerProps}
        class={cn(
            inputBase,
            "flex items-center justify-between gap-2 text-left",
            "data-[placeholder]:text-ink-muted disabled:cursor-not-allowed disabled:opacity-50",
            triggerClass
        )}
    >
        <span class="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
            class="text-ink-muted size-4 shrink-0 transition-transform duration-[250ms] ease-[var(--ease)] data-[state=open]:rotate-180"
            aria-hidden="true"
        />
    </SelectPrimitive.Trigger>

    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            sideOffset={6}
            class={cn(
                "border-hair bg-card z-50 max-h-[min(22rem,var(--bits-select-content-available-height))] w-[var(--bits-select-anchor-width)] min-w-[8rem] overflow-y-auto overscroll-contain rounded-[11px] border border-solid p-1.5 shadow-xl outline-none",
                "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:zoom-out-95 motion-safe:data-[state=open]:zoom-in-95 motion-safe:duration-150",
                contentClass
            )}
        >
            <SelectPrimitive.Viewport>
                {#each options as option (option.value)}
                    <SelectPrimitive.Item
                        value={option.value}
                        label={option.label}
                        {...option.disabled === undefined ? {} : { disabled: option.disabled }}
                        class={cn(
                            "ease-[var(--ease)] flex w-full cursor-pointer items-center justify-between gap-2 rounded-[7px] px-3 py-2.5 text-left font-mono text-xs transition-colors duration-150 outline-none select-none",
                            "text-ink-muted data-highlighted:bg-ink-2 data-highlighted:text-foreground",
                            "data-[state=checked]:text-foreground data-disabled:pointer-events-none data-disabled:opacity-40"
                        )}
                    >
                        {#snippet children({ selected })}
                            <span class="truncate">{option.label}</span>
                            {#if selected}
                                <Check class="text-signal size-4 shrink-0" aria-hidden="true" />
                            {/if}
                        {/snippet}
                    </SelectPrimitive.Item>
                {/each}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
</SelectPrimitive.Root>

<script lang="ts" module>
    import { cva, type VariantProps } from "class-variance-authority";
    import type { HTMLButtonAttributes } from "svelte/elements";

    export const buttonVariants = cva(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        {
            variants: {
                variant: {
                    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                    destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
                    outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
                    secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
                    ghost: "hover:bg-accent hover:text-accent-foreground",
                    link: "text-primary underline-offset-4 hover:underline"
                },
                size: {
                    default: "h-9 px-4 py-2",
                    sm: "h-8 rounded-md px-3 text-xs",
                    lg: "h-10 rounded-md px-8",
                    icon: "h-9 w-9"
                }
            },
            defaultVariants: {
                variant: "default",
                size: "default"
            }
        }
    );

    export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
    export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

    export interface ButtonProps extends Omit<HTMLButtonAttributes, "class"> {
        variant?: ButtonVariant;
        size?: ButtonSize;
        class?: string;
    }
</script>

<script lang="ts">
    import type { Snippet } from "svelte";
    import { cn } from "$lib/utils";

    let {
        variant = "default",
        size = "default",
        class: className,
        children,
        ...restProps
    }: ButtonProps & { children?: Snippet } = $props();
</script>

<button class={cn(buttonVariants({ variant, size, className }))} {...restProps}>
    {@render children?.()}
</button>

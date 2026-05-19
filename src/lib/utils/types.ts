/**
 * Helper type used by shadcn-svelte primitives to expose a bindable `ref`
 * on top of the wrapped element's native attributes.
 */
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
    ref?: E | null;
};

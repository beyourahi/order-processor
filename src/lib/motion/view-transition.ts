import type { OnNavigate } from "@sveltejs/kit";
import { prefersReducedMotion } from "$lib/motion/reduced-motion.svelte";

type NavigateCallback = Parameters<typeof import("$app/navigation").onNavigate>[0];
type NavigationArg = OnNavigate;

let navigating = false;

export const isNavigating = (): boolean => navigating;

export const handleViewTransition: NavigateCallback = (navigation: NavigationArg) => {
    navigating = true;

    const supported = typeof document !== "undefined" && typeof document.startViewTransition === "function";

    if (!supported || prefersReducedMotion.current) {
        void navigation.complete.finally(() => {
            navigating = false;
        });
        return;
    }

    return new Promise<void>((resolve) => {
        const transition = document.startViewTransition(async () => {
            resolve();
            await navigation.complete;
        });
        void transition.finished.finally(() => {
            navigating = false;
        });
    });
};

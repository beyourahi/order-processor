import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names with Tailwind CSS
 * Combines clsx for conditional classes and tailwind-merge for conflicting classes
 */
export const cn = (...inputs: ClassValue[]): string => {
    return twMerge(clsx(inputs));
};

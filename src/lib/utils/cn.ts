/**
 * Class name utility for Tailwind CSS
 * Combines clsx for conditional classes and tailwind-merge for conflicting classes
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS conflict resolution
 * @param inputs - Class values (strings, arrays, objects, conditionals)
 * @returns Merged and deduplicated class string
 */
export const cn = (...inputs: ClassValue[]): string => {
    return twMerge(clsx(inputs));
};

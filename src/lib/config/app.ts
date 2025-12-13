/**
 * Application metadata and configuration
 * Core application information used throughout the app
 */

import type { AppConfig } from "$lib/types";

/**
 * Application metadata configuration
 * Used for meta tags, headers, and general app information
 */
export const APP_CONFIG: AppConfig = {
    name: "Order Processor",
    description: "Process and format orders for multiple courier services",
    url: "https://order-processor.pages.dev",
    repository: {
        type: "git",
        url: "https://github.com/beyourahi/order-processor"
    },
    author: {
        name: "Rahi Khan",
        url: "https://beyourahi.com"
    }
};

/**
 * Application metadata and configuration
 * Core application information used throughout the app
 */

import type { AppConfig } from "@/types";

/**
 * Application metadata configuration
 * Used for meta tags, headers, and general app information
 */
export const appConfig: AppConfig = {
    name: "Order Processor",
    description: "Process and format orders for multiple courier services",
    url: "https://order-processor.vercel.app",
    repository: {
        url: "https://github.com/beyourahi/order-processor",
        type: "git"
    },
    author: {
        name: "Rahi Khan",
        email: "beyourahi@gmail.com",
        url: "https://beyourahi.com"
    }
};

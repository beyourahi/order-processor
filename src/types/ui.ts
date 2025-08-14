/**
 * UI component types and interfaces
 * Contains all types related to UI components, props, and component interactions
 */

import type { VariantProps } from "class-variance-authority";
import type { PropsWithChildren } from "react";
import type { buttonVariants } from "@/components/ui/button";

// ==================== UI Component Interfaces ====================

/**
 * Application context type for state management
 * Defines the shape of the global application context
 */
export interface AppContextType {
    courierService: string;
    setCourierService: (courier: string) => void;
    CSVReader: any;
    zoneHover: boolean;
    setZoneHover: (hover: boolean) => void;
}

/**
 * CSV Reader props interface
 * Properties for the CSV file reader component
 */
export interface CSVReaderProps {
    getRootProps: () => Record<string, any>;
    acceptedFile: File | null;
}

/**
 * Download component props
 * Properties for the download functionality component
 */
export interface DownloadProps {
    acceptedFile: File;
}

/**
 * Error boundary props
 * Properties for error handling components
 */
export interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Button component props
 * Extended properties for custom button components
 */
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

// ==================== Re-exports for External Types ====================

export type { 
    VariantProps,
    PropsWithChildren
};
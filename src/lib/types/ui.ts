/**
 * UI component types and interfaces
 * Contains Svelte-specific types for UI components and interactions
 */

// ==================== File Handling ====================

/**
 * Props for file drop zone component
 */
export interface DropZoneProps {
    onDrop: (files: FileList) => void;
    accept?: string;
    disabled?: boolean;
}

/**
 * Props for download component
 */
export interface DownloadProps {
    fileName: string;
    fileSize: number;
}

// ==================== Error Handling ====================

/**
 * Error boundary props for error handling components
 */
export interface ErrorProps {
    error: Error;
    reset: () => void;
}

// ==================== CSV Processing ====================

/**
 * CSV parse result from Papa Parse library
 * Represents the structure returned by the CSV parser
 */
export interface CSVParseResult {
    data: string[][];
    errors: Array<{
        type: string;
        code: string;
        message: string;
        row?: number | undefined;
    }>;
    meta: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
        cursor: number;
    };
}

// ==================== Application State ====================

/**
 * App store state for global state management
 * Used by Svelte stores/runes for reactive state
 */
export interface AppState {
    courierService: string;
    zoneHover: boolean;
    acceptedFile: File | null;
}

import * as XLSX from "xlsx";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useAppContext } from "@/lib/context/AppContext";
import { CourierService } from "@/services";
import { FILE_PREFIX, FILE_EXTENSION } from "@/config";
import { cn } from "@/lib/utils";
import type { CSVReaderProps } from "@/types";
import { Upload } from "@/components/upload";
import { Download } from "@/components/download";

export function OrderProcessor() {
    const { CSVReader, courierService, zoneHover, setZoneHover } = useAppContext();
    const currentUser = useCurrentUser();

    // Handle CSV file processing and Excel generation
    const handleUploadAccepted = (res: any) => {
        const rawData = res.data;

        // Guard clause - ensure user has a valid courier configuration
        if (!currentUser?.courier) return;

        // Process raw CSV data through the appropriate courier processor
        const processedOrders = CourierService.processOrders(currentUser.courier, rawData, {
            name: currentUser.name,
            phone: currentUser.phone || "",
            merchant_id: currentUser.merchant_id || ""
        });

        // Generate Excel file with processed orders
        const worksheet = XLSX.utils.json_to_sheet(processedOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
        
        // Auto-download file with courier-specific naming
        XLSX.writeFile(workbook, `${FILE_PREFIX}-${currentUser.courier.toLowerCase()}${FILE_EXTENSION}`);

        // Reset drag state after successful processing
        setZoneHover(false);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setZoneHover(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setZoneHover(false);
    };

    return (
        <CSVReader
            // Disable upload if no courier selected or user's courier doesn't match selection
            // This prevents processing with wrong courier configuration
            disabled={courierService === "" || currentUser?.courier !== courierService}
            onUploadAccepted={handleUploadAccepted}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* Render prop pattern - CSVReader provides file handling functionality */}
            {({ getRootProps, acceptedFile }: CSVReaderProps) => (
                <div
                    {...getRootProps()}
                    className={cn(
                        "flex h-80 w-full flex-col items-center justify-center lg:w-1/2",
                        // Visual feedback for drag and drop state
                        zoneHover && "border-zinc-600"
                    )}
                >
                    {/* Conditional UI: show download preview or upload prompt */}
                    {acceptedFile ? <Download acceptedFile={acceptedFile} /> : <Upload />}
                </div>
            )}
        </CSVReader>
    );
}

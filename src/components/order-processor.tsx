import * as XLSX from "xlsx";
import { cn } from "../lib/utils";
import { useCurrentUser } from "../lib/hooks/useCurrentUser";
import { useAppContext } from "../lib/context/AppContext";
import { CourierService } from "../lib/services/courier";
import { FILE_PREFIX, FILE_EXTENSION } from "../constants";
import type { CSVReaderProps } from "../types";
import { Upload } from "./upload";
import { Download } from "./download";

export function OrderProcessor() {
    const { CSVReader, courierService, zoneHover, setZoneHover } = useAppContext();
    const currentUser = useCurrentUser();

    const handleUploadAccepted = (res: any) => {
        const rawData = res.data;

        if (!currentUser?.courier) return;

        const processedOrders = CourierService.processOrders(currentUser.courier, rawData, {
            name: currentUser.name,
            phone: currentUser.phone || "",
            merchant_id: currentUser.merchant_id || ""
        });

        const worksheet = XLSX.utils.json_to_sheet(processedOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
        XLSX.writeFile(workbook, `${FILE_PREFIX}-${currentUser.courier.toLowerCase()}${FILE_EXTENSION}`);

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
            disabled={courierService === "" || currentUser?.courier !== courierService}
            onUploadAccepted={handleUploadAccepted}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {({ getRootProps, acceptedFile }: CSVReaderProps) => (
                <div
                    {...getRootProps()}
                    className={cn(
                        "flex h-80 w-full flex-col items-center justify-center lg:w-1/2",
                        zoneHover && "border-zinc-600"
                    )}
                >
                    {acceptedFile ? <Download acceptedFile={acceptedFile} /> : <Upload />}
                </div>
            )}
        </CSVReader>
    );
}
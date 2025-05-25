import * as XLSX from "xlsx";
import { cn, prepareOrderData } from "lib";
import { useContext, useState } from "react";
import { Upload } from "./upload";
import { Download } from "./download";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { brands } from "data";
import { useCSVReader } from "react-papaparse";
import { Context } from "app/providers";
import { CourierService } from "service";

export const OrderProcessor = () => {
    const { CSVReader } = useCSVReader();
    const [zoneHover, setZoneHover] = useState(false);
    const { courierService } = useContext(Context);
    const { user } = useKindeBrowserClient();

    const current_user = () => {
        for (const brand of brands) {
            if (brand.emails.includes(user?.email!)) {
                return {
                    name: brand.name,
                    phone: brand.phone,
                    courier: brand.courier,
                    merchant_id: brand.merchant_id
                };
            }
        }
    };

    return (
        <CSVReader
            disabled={courierService === "" || current_user()?.courier !== courierService}
            onUploadAccepted={(res: any) => {
                const rawData = res.data;
                const orderData = prepareOrderData(rawData);
                const currentUser = current_user();

                if (!currentUser?.courier) return;

                const processedOrders = CourierService.processOrders(currentUser.courier, orderData, {
                    name: currentUser.name,
                    phone: currentUser.phone || "",
                    merchant_id: currentUser.merchant_id
                });

                const worksheet = XLSX.utils.json_to_sheet(processedOrders);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
                XLSX.writeFile(workbook, `formatted-orders-${currentUser.courier.toLowerCase()}.xlsx`);

                setZoneHover(false);
            }}
            onDragOver={(e: DragEvent) => {
                e.preventDefault();
                setZoneHover(true);
            }}
            onDragLeave={(e: DragEvent) => {
                e.preventDefault();
                setZoneHover(false);
            }}
        >
            {({ getRootProps, acceptedFile }: any) => (
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
};

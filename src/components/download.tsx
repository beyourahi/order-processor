import { formatFileSize } from "react-papaparse";
import Image from "next/image";
import { useAppContext } from "@/lib/context/AppContext";
import { cn } from "@/lib/utils";
import type { DownloadProps } from "@/types";
import download from "@/public/download.gif";

export function Download({ acceptedFile }: DownloadProps) {
    const { courierService } = useAppContext();

    return (
        <div
            className={cn(
                "sleek flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed bg-white/10 px-12 py-6 text-white active:bg-white/20 xl:hover:bg-white/20",
                courierService !== "" && "cursor-pointer"
            )}
        >
            <Image src={download} alt="Download Gif" />

            <span className="flex flex-col items-start">
                <span className="text-lg font-semibold">{acceptedFile.name}</span>
                <span className="text-sm font-medium">{formatFileSize(acceptedFile.size)}</span>
            </span>
        </div>
    );
}

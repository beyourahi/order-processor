import { formatFileSize } from "react-papaparse";
import { cn } from "lib";
import { Context } from "app/providers";
import { useContext } from "react";
import Image from "next/image";
import download from "public/download.gif";

export const Download = ({ acceptedFile }: { acceptedFile: any }) => {
    const { courierService } = useContext(Context);

    return (
        <div
            className={cn(
                "sleek flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed bg-white/10 px-12 py-6 text-white active:bg-white/20 xl:hover:bg-white/20",
                courierService !== "" && "cursor-pointer"
            )}
        >
            <Image src={download} alt="Upload Gif" />

            <span className="flex flex-col items-start">
                <span className="text-lg font-semibold">{acceptedFile.name}</span>
                <span className="text-sm font-medium">{formatFileSize(acceptedFile.size)}</span>
            </span>
        </div>
    );
};

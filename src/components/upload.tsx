import Image from "next/image";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useAppContext } from "@/lib/context/AppContext";
import { cn } from "@/lib/utils";
import upload from "@/public/upload.gif";

export function Upload() {
    const { courierService } = useAppContext();
    const currentUser = useCurrentUser();

    const isDisabled = courierService === "" || currentUser?.courier !== courierService;
    const canUpload = currentUser?.courier === courierService;

    return (
        <div
            className={cn(
                "sleek flex h-full w-full transform-gpu flex-col items-center justify-center gap-8 rounded-xl border-2 border-dashed border-zinc-300 bg-white/10 px-12 py-16 text-white drop-shadow-xl md:py-20 lg:px-20 lg:py-24 2xl:px-32",
                isDisabled ? "cursor-not-allowed" : "cursor-pointer",
                canUpload && "active:bg-white/20 xl:hover:bg-white/20"
            )}
        >
            <Image src={upload} alt="Upload Gif" />

            <span className="text-center text-sm font-medium whitespace-nowrap lg:text-base 2xl:text-lg">
                {isDisabled ? "Select Courier Service" : "Drop file here or Click to upload"}
            </span>
        </div>
    );
}

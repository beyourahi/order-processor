import { cn } from "lib";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { brands } from "data";
import { Context } from "app/providers";
import { useContext } from "react";
import Image from "next/image";
import upload from "public/upload.gif";

export const Upload = () => {
    const { user } = useKindeBrowserClient();
    const { courierService } = useContext(Context);

    const current_user = () => {
        for (const brand of brands) {
            if (brand.emails.includes(user?.email!)) {
                return { name: brand.name, phone: brand.phone, courier: brand.courier };
            }
        }
    };

    return (
        <div
            className={cn(
                "sleek flex h-full w-full transform-gpu flex-col items-center justify-center gap-8 rounded-xl border-2 border-dashed border-zinc-300 bg-white/10 px-12 py-16 text-white drop-shadow-xl md:py-20 lg:px-20 lg:py-24 2xl:px-32",
                courierService === "" || current_user()?.courier !== courierService
                    ? "cursor-not-allowed"
                    : "cursor-pointer",
                current_user()?.courier === courierService && "active:bg-white/20 xl:hover:bg-white/20"
            )}
        >
            <Image src={upload} alt="Upload Gif" />

            <span className="whitespace-nowrap text-center text-sm font-medium lg:text-base 2xl:text-lg">
                {courierService === "" || current_user()?.courier !== courierService
                    ? "Select Courier Service"
                    : "Drop file here or Click to upload"}
            </span>
        </div>
    );
};

import Image from "next/image";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAppContext } from "../lib/context/AppContext";
import { COURIER_OPTIONS } from "../config";
import { Button } from "./ui/button";

const cn = (...inputs: ClassValue[]): string => {
    return twMerge(clsx(inputs));
};

export function CourierPicker() {
    const { courierService, setCourierService } = useAppContext();

    const handleCourierSelect = (value: string) => {
        setCourierService(value);
    };

    return (
        <div className="items flex h-80 w-full flex-col gap-4 rounded-xl bg-white/10 p-2 text-left text-white drop-shadow-xl lg:w-1/2">
            <div className="flex flex-col overflow-y-scroll">
                {COURIER_OPTIONS.map(({ value, label, logo, coming_soon }) => (
                    <Button
                        disabled={coming_soon}
                        key={value}
                        size="lg"
                        onClick={() => handleCourierSelect(value)}
                        className={cn(
                            "sleek m-2 cursor-pointer justify-start gap-4 rounded-[0.7rem] py-7 pl-4 font-semibold shadow-none",
                            courierService === value
                                ? "bg-green-400/30! ring-3 ring-green-400 active:bg-green-400/30! xl:hover:bg-green-400/30!"
                                : "bg-white/10 active:scale-95 active:bg-green-400/20! xl:hover:bg-green-400/20!",
                            coming_soon && "cursor-not-allowed bg-white/5 opacity-50"
                        )}
                    >
                        <Image src={logo} alt={label} className="h-7 w-7 rounded-full object-cover" />

                        <div className="flex items-center gap-2">
                            <span>{label}</span>
                            {coming_soon && <span>(COMING SOON)</span>}
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    );
}

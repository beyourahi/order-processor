import Image from "next/image";
import { useAppContext } from "@/lib/context/AppContext";
import { cn } from "@/lib/utils";
import { COURIER_OPTIONS } from "@/config";
import { Button } from "@/components/ui/button";

export function CourierPicker() {
    const { courierService, setCourierService } = useAppContext();

    const handleCourierSelect = (value: string) => {
        setCourierService(value);
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 rounded-xl bg-white/10 p-2 text-left text-white drop-shadow-xl lg:w-1/2">
            {COURIER_OPTIONS.map(({ value, label, logo }) => (
                <Button
                    key={value}
                    size="lg"
                    onClick={() => handleCourierSelect(value)}
                    className={cn(
                        "sleek h-full cursor-pointer justify-start gap-4 rounded-[0.7rem] py-7 pl-4 font-semibold shadow-none",
                        courierService === value
                            ? "bg-green-400/30! ring-3 ring-green-400 active:bg-green-400/30! xl:hover:bg-green-400/30!"
                            : "bg-white/10 active:scale-95 active:bg-green-400/20! xl:hover:bg-green-400/20!"
                    )}
                >
                    <Image src={logo} alt={label} className="h-7 w-7 rounded-full object-cover" />
                    <span>{label}</span>
                </Button>
            ))}
        </div>
    );
}

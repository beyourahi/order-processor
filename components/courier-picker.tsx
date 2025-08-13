import { useContext } from "react";
import Image from "next/image";
import { cn } from "lib";
import pathao from "public/pathao.png";
import steadFast from "public/steadfast.png";
import redx from "public/redx.png";
import sheba from "public/sheba.jpg";
import ecourier from "public/ecourier.webp";
import dhl from "public/dhl.png";
import fedex from "public/fedex.jpeg";
import { Context } from "app/providers";
import { Button } from "./ui/button";

const COURIER_OPTIONS = [
    { value: "Pathao", label: "Pathao", logo: pathao },
    { value: "SteadFast", label: "SteadFast", logo: steadFast },
    { value: "REDX", label: "REDX", logo: redx, coming_soon: true },
    { value: "Sheba", label: "Sheba", logo: sheba, coming_soon: true },
    { value: "eCourier", label: "eCourier", logo: ecourier, coming_soon: true },
    { value: "FedX", label: "FedX", logo: fedex, coming_soon: true },
    { value: "DHL", label: "DHL", logo: dhl, coming_soon: true }
];

export const CourierPicker = () => {
    const { courierService, setCourierService } = useContext(Context);

    return (
        <div className="items flex h-80 w-full flex-col gap-4 rounded-xl bg-white/10 p-2 text-left text-white drop-shadow-xl lg:w-1/2">
            <div className="flex flex-col overflow-y-scroll">
                {COURIER_OPTIONS.map(({ value, label, logo, coming_soon }) => (
                    <Button
                        disabled={coming_soon}
                        key={value}
                        size="lg"
                        onClick={() => setCourierService(value)}
                        className={cn(
                            "sleek m-2 cursor-pointer justify-start gap-4 rounded-[0.7rem] py-7 pl-4 font-semibold shadow-none",
                            courierService === value
                                ? "!bg-green-400/30 ring-3 ring-green-400 active:!bg-green-400/30 xl:hover:!bg-green-400/30"
                                : "bg-white/10 active:scale-95 active:!bg-green-400/20 xl:hover:!bg-green-400/20",
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
};

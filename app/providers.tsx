"use client";

import { PropsWithChildren, createContext, useState } from "react";
import { useCSVReader } from "react-papaparse";

export const Context = createContext<any>({} as any);

export function Providers({ children }: PropsWithChildren) {
    const { CSVReader } = useCSVReader();
    const [zoneHover, setZoneHover] = useState(false);

    const [courierService, setCourierService] = useState("");

    return (
        <Context.Provider
            value={{
                courierService,
                setCourierService,
                CSVReader,
                zoneHover,
                setZoneHover
            }}
        >
            {children}
        </Context.Provider>
    );
}

"use client";

import { PropsWithChildren, createContext, useContext, useState } from "react";
import { useCSVReader } from "react-papaparse";
import type { AppContextType } from "../../types";

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const { CSVReader } = useCSVReader();
  const [courierService, setCourierService] = useState<string>("");
  const [zoneHover, setZoneHover] = useState<boolean>(false);

  const contextValue: AppContextType = {
    courierService,
    setCourierService,
    CSVReader,
    zoneHover,
    setZoneHover
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context with proper error handling
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
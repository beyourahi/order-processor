import { PropsWithChildren } from "react";
import { AppProvider } from "../lib/context/AppContext";

export function Providers({ children }: PropsWithChildren) {
    return <AppProvider>{children}</AppProvider>;
}

import "./globals.css";
import "../tailwind.css";
import type { Metadata } from "next";
import { PropsWithChildren } from "react";
import { GeistSans } from "geist/font/sans";
import { Providers } from "./providers";
import { Footer } from "../components/footer";

export const metadata: Metadata = {
    title: "Shopify Order Processor",
    description: "Shopify Order Processor App"
};

const RootLayout = ({ children }: PropsWithChildren) => (
    <html lang="en" className="scroll-smooth bg-[#0F0F0F] text-white" suppressHydrationWarning>
        <body>
            <Providers>
                <main className={`relative flex h-dvh flex-col antialiased ${GeistSans.className}`}>
                    {children}
                    <Footer />
                </main>
            </Providers>
        </body>
    </html>
);

export default RootLayout;

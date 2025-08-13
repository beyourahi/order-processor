import "./globals.css";
import "../tailwind.css";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { GeistSans } from "geist/font/sans";
import { Providers } from "./providers";
import { Footer } from "../components/footer";

export { viewport } from "./viewport";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: {
        template: "%s | Shopify Order Processor",
        default: "Shopify Order Processor - Turn Chaos into Orders"
    },
    description: "Professional order processing tool for Shopify merchants. Convert CSV files to courier-ready formats for Pathao, SteadFast, and other delivery services. Streamline your e-commerce fulfillment workflow.",
    keywords: ["Shopify", "Order Processing", "CSV Converter", "Pathao", "SteadFast", "E-commerce", "Fulfillment", "Delivery"],
    authors: [{ name: "beyourahi", url: "https://beyourahi.com" }],
    creator: "beyourahi",
    publisher: "beyourahi",
    applicationName: "Shopify Order Processor",
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    category: "E-commerce Tools",
    classification: "Business Application",
    robots: {
        index: false, // Keep private for internal use
        follow: false,
        noarchive: true,
        nosnippet: true,
        noimageindex: true
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        siteName: "Shopify Order Processor",
        title: "Shopify Order Processor - Turn Chaos into Orders",
        description: "Professional order processing tool for Shopify merchants. Convert CSV files to courier-ready formats.",
        images: [
            {
                url: "/favicon-32x32.png",
                width: 32,
                height: 32,
                alt: "Shopify Order Processor"
            }
        ]
    },
    twitter: {
        card: "summary",
        title: "Shopify Order Processor",
        description: "Turn Chaos into Orders - Professional order processing for Shopify",
        creator: "@beyourahi"
    },
    manifest: "/manifest.json",
    other: {
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "black-translucent",
        "msapplication-TileColor": "#0F0F0F"
    }
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

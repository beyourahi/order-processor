"use client";

import { Suspense } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { allowedEmails } from "@/config";
import { CourierPicker } from "@/components/courier-picker";
import { OrderProcessor } from "@/components/order-processor";
import { Heading } from "@/components/ui/heading";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NotAuthorized } from "@/components/ui/not-authorized";
import User from "@/components/user";

const Page = () => {
    const { user, isLoading } = useKindeBrowserClient();
    // Email-based authorization - check if user's email is in the allowlist
    // This ensures only authorized merchants can access the order processing system
    const isGranted = allowedEmails.includes(user?.email || "");

    return (
        <div className="flex w-full grow flex-col items-center justify-center gap-20 px-4 pt-4 xl:pt-8">
            <Heading />

            {/* Three-state authentication flow: loading, authorized, or denied */}
            {isLoading ? (
                <LoadingSpinner />
            ) : isGranted ? (
                <div className="flex w-full flex-col items-center gap-20 text-center">
                    {/* Main interface - responsive layout with col-reverse on mobile for better UX */}
                    <div className="flex w-full max-w-xl flex-col-reverse items-center justify-center gap-12 lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl">
                        {/* Order processor with lazy loading and skeleton fallback */}
                        <Suspense
                            fallback={
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-48 w-96 animate-pulse rounded-lg bg-white/10"></div>
                                    <p className="text-sm text-zinc-400">Loading order processor...</p>
                                </div>
                            }
                        >
                            <OrderProcessor />
                        </Suspense>

                        {/* Courier picker with separate lazy loading for better performance */}
                        <Suspense
                            fallback={
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-48 w-80 animate-pulse rounded-lg bg-white/10"></div>
                                    <p className="text-sm text-zinc-400">Loading courier options...</p>
                                </div>
                            }
                        >
                            <CourierPicker />
                        </Suspense>
                    </div>

                    <Suspense
                        fallback={
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 animate-pulse rounded-full bg-white/10"></div>
                                <div className="h-4 w-32 animate-pulse rounded bg-white/10"></div>
                            </div>
                        }
                    >
                        <User />
                    </Suspense>
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    );
};

export default Page;

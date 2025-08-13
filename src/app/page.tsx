"use client";

import { Suspense } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { allowedEmails } from "../config/brands";
import { CourierPicker } from "../components/courier-picker";
import { NotAuthorized } from "../components/not-authorized";
import { OrderProcessor } from "../components/order-processor";
import { Heading } from "../components/heading";
import { LoadingSpinner } from "../components/loading-spinner";
import User from "../components/user";

const Page = () => {
    const { user, isLoading } = useKindeBrowserClient();
    const isGranted = allowedEmails.includes(user?.email || "");

    return (
        <div className="flex w-full grow flex-col items-center justify-center gap-20 px-4 pt-4 xl:pt-8">
            <Heading />

            {isLoading ? (
                <LoadingSpinner />
            ) : isGranted ? (
                <div className="flex w-full flex-col items-center gap-20 text-center">
                    <div className="flex w-full max-w-xl flex-col-reverse items-center justify-center gap-12 lg:max-w-4xl lg:flex-row lg:gap-12 2xl:max-w-6xl">
                        <Suspense fallback={
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-pulse bg-white/10 rounded-lg h-48 w-96"></div>
                                <p className="text-sm text-zinc-400">Loading order processor...</p>
                            </div>
                        }>
                            <OrderProcessor />
                        </Suspense>
                        
                        <Suspense fallback={
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-pulse bg-white/10 rounded-lg h-48 w-80"></div>
                                <p className="text-sm text-zinc-400">Loading courier options...</p>
                            </div>
                        }>
                            <CourierPicker />
                        </Suspense>
                    </div>

                    <Suspense fallback={
                        <div className="flex items-center gap-2">
                            <div className="animate-pulse bg-white/10 rounded-full h-8 w-8"></div>
                            <div className="animate-pulse bg-white/10 rounded h-4 w-32"></div>
                        </div>
                    }>
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

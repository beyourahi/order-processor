"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { CourierPicker } from "components/courier-picker";
import { allowedEmails } from "data";
import { NotAuthorized } from "components/not-authorized";
import { OrderProcessor } from "components/order-processor";
import { Heading } from "components/heading";
import { LoadingSpinner } from "components/loading-spinner";
import User from "components/user";

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
                        <OrderProcessor />
                        <CourierPicker />
                    </div>

                    <User />
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    );
};

export default Page;

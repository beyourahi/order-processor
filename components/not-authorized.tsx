import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

export const NotAuthorized = () => (
    <div className="flex flex-col items-center gap-4">
        <p className="text-xl font-bold lg:text-2xl">Sorry bruh, you ain&apos;t allowed here</p>
        <LogoutLink className="sleek rounded-lg bg-red-400 px-12 py-3 text-sm font-semibold text-white active:bg-red-600 lg:text-base xl:hover:bg-red-600">
            Logout
        </LogoutLink>
    </div>
);

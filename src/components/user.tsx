import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

function User() {
    const { user } = useKindeBrowserClient();
    const currentUser = useCurrentUser();

    if (!currentUser) return null;

    return (
        <div className="flex w-full flex-col gap-8 text-zinc-400 sm:max-w-xl sm:items-center sm:gap-16 md:flex-row md:justify-between lg:max-w-4xl 2xl:max-w-6xl">
            <div className="flex flex-col items-start gap-2 text-sm">
                <span>
                    Name:{" "}
                    <span className="sleek font-bold text-zinc-300 active:text-zinc-400 xl:hover:text-zinc-400">
                        <Link href={currentUser.url || "#"} target="_blank">
                            <span>{currentUser.name}</span>
                        </Link>
                    </span>
                </span>

                <span>
                    E-mail:{" "}
                    <span className="sleek font-bold text-zinc-300 active:text-zinc-400 xl:hover:text-zinc-400">
                        <Link href={currentUser.url || "#"} target="_blank">
                            <span>{user?.email}</span>
                        </Link>
                    </span>
                </span>
            </div>

            <LogoutLink className="sleek rounded-xl bg-red-500 px-12 py-3 text-sm font-bold text-white uppercase active:scale-95 active:bg-red-700 xl:hover:bg-red-700">
                Log Out
            </LogoutLink>
        </div>
    );
}

export default User;

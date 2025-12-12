/**
 * Footer component
 * Application footer with attribution
 */

import Link from "next/link";

export const Footer = () => {
    return (
        <div className="flex items-center justify-center px-4 pt-12 pb-6 text-center text-sm text-zinc-400 xl:px-8 xl:pt-2 xl:pb-6">
            <p>
                <Link href="https://beyourahi.com" target="_blank" className="group sleek">
                    Designed by{" "}
                    <span className="underline-offset-4 group-hover:text-white group-hover:underline">Rahi Khan</span>
                </Link>
            </p>
        </div>
    );
};

import Link from "next/link";

export const Footer = () => {
    return (
        <div className="flex items-center justify-center px-4 pb-6 pt-12 text-center text-sm text-zinc-400 xl:px-8 xl:pb-6 xl:pt-2">
            <p>
                <Link
                    href="https://beyourahi.com"
                    target="_blank"
                    className="group sleek"
                >
                    Designed by <span className="group-hover:text-white group-hover:underline underline-offset-4">@beyourahi</span>
                </Link>
            </p>
        </div>
    );
};

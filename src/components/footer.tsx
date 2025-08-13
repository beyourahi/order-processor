import Link from "next/link";

export const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <div className="flex flex-col items-center justify-center gap-6 px-4 pb-8 pt-12 text-center text-sm text-zinc-400 sm:flex-row sm:justify-between xl:px-8 xl:pb-12 xl:pt-2">
            <p>Copyright &copy; {year}</p>

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

import Link from "next/link";

export const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <div className="flex flex-col items-center justify-center gap-6 px-4 pb-8 pt-12 text-center text-sm text-zinc-400 sm:flex-row sm:justify-between xl:px-8 xl:pb-12 xl:pt-2">
            <p>Copyright &copy; {year}</p>

            <p className="flex flex-col items-center gap-1 sm:items-end">
                <span>
                    <Link
                        href="https://beyourahi.com"
                        target="_blank"
                        className="sleek underline underline-offset-4 active:text-zinc-300 active:underline-offset-[6px] xl:hover:text-zinc-300 xl:hover:underline-offset-[6px]"
                    >
                        Rahi Khan
                    </Link>{" "}
                    appreciates you using this app.
                </span>

                <span>Happy processing orders! 🥳</span>
            </p>
        </div>
    );
};

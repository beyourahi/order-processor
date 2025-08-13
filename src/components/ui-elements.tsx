import Link from "next/link";

// ================== LOADING SPINNER ==================
export const LoadingSpinner = () => <span className="loader"></span>;

// ================== HEADING ==================
export const Heading = () => (
    <div className="space-y-8 text-center">
        <p className="text-5xl">🚀</p>

        <div className="space-y-2">
            <h1 className="text-3xl font-black lg:text-4xl">Shopify Order Processor</h1>
            <p className="text-zinc-400">Turn Chaos into Orders</p>
        </div>
    </div>
);

// ================== FOOTER ==================
export const Footer = () => {
    return (
        <div className="flex items-center justify-center px-4 pt-12 pb-6 text-center text-sm text-zinc-400 xl:px-8 xl:pt-2 xl:pb-6">
            <p>
                <Link href="https://beyourahi.com" target="_blank" className="group sleek">
                    Designed by{" "}
                    <span className="underline-offset-4 group-hover:text-white group-hover:underline">@beyourahi</span>
                </Link>
            </p>
        </div>
    );
};

// ================== NOT AUTHORIZED ==================
export const NotAuthorized = () => (
    <div className="space-y-4 text-center">
        <p className="text-5xl">🔒</p>
        <p className="max-w-sm text-balance text-zinc-400">You are not authorized to access this application</p>
    </div>
);

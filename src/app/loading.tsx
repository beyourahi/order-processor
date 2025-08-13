import { LoadingSpinner } from "../components/loading-spinner";

export default function Loading() {
    return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-8 px-4 text-center">
            <div className="space-y-6">
                <div className="text-5xl">🚀</div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">Loading Application</h2>
                    <p className="text-zinc-400">Preparing your order processing workspace...</p>
                </div>
            </div>
            
            <LoadingSpinner />
        </div>
    );
}
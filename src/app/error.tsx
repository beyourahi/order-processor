"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/button";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-8 px-4 text-center">
            <div className="space-y-4">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
                <p className="text-zinc-400 max-w-md">
                    We encountered an unexpected error while processing your request. 
                    Please try again or contact support if the problem persists.
                </p>
                {process.env.NODE_ENV === "development" && (
                    <details className="mt-4 text-left">
                        <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300">
                            Error Details (Development Only)
                        </summary>
                        <pre className="mt-2 rounded bg-red-950/20 p-3 text-xs text-red-200 overflow-auto">
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}
            </div>
            
            <div className="flex gap-4">
                <Button
                    onClick={reset}
                    variant="default"
                    className="bg-white text-black hover:bg-white/90"
                >
                    Try Again
                </Button>
                <Button
                    onClick={() => window.location.href = "/"}
                    variant="outline"
                    className="border-zinc-600 text-white hover:bg-zinc-800"
                >
                    Go Home
                </Button>
            </div>
        </div>
    );
}
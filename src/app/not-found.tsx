"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-8 px-4 text-center">
            <div className="space-y-4">
                <div className="text-6xl">📦</div>
                <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
                <p className="text-zinc-400 max-w-md">
                    The page you&apos;re looking for doesn&apos;t exist. It might have been moved, 
                    deleted, or you entered the wrong URL.
                </p>
            </div>
            
            <div className="flex gap-4">
                <Button asChild variant="default" className="bg-white text-black hover:bg-white/90">
                    <Link href="/">
                        Go Home
                    </Link>
                </Button>
                <Button 
                    onClick={() => window.history.back()}
                    variant="outline" 
                    className="border-zinc-600 text-white hover:bg-zinc-800"
                >
                    Go Back
                </Button>
            </div>
        </div>
    );
}
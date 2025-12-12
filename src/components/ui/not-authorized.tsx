/**
 * Not authorized component
 * Displays when user is not authorized to access the application
 */

export const NotAuthorized = () => (
    <div className="space-y-4 text-center">
        <p className="text-5xl">🔒</p>
        <p className="max-w-sm text-balance text-zinc-400">You are not authorized to access this application</p>
    </div>
);

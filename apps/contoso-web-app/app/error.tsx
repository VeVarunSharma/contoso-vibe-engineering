"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">
          Error
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. You can try again, or return to the
          homepage.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono">
            Error reference: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}

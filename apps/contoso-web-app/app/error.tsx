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
    <section
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      aria-labelledby="error-title"
    >
      <div className="max-w-md">
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">
          Error
        </p>
        <h1 id="error-title" className="text-3xl font-bold tracking-tight mb-3">
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
            type="button"
            onClick={reset}
            className="min-h-11 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/90 outline-offset-4 focus-visible:outline-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent outline-offset-4 focus-visible:outline-2"
          >
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}

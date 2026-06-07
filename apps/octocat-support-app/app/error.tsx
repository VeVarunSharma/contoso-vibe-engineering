"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

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
    <main className="container flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <AlertCircle
        className="h-16 w-16 text-destructive mb-6"
        aria-hidden="true"
      />
      <h1 className="text-3xl font-bold tracking-tight mb-3">
        Something went wrong
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        We hit an unexpected error while loading this page. Try again, or head
        back to the support home.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-6 font-mono">
          Error reference: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Link>
        </Button>
      </div>
    </main>
  );
}

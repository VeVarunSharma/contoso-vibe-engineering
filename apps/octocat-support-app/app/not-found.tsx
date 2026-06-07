import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export default function NotFound() {
  return (
    <main className="container flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <FileQuestion
        className="h-16 w-16 text-muted-foreground mb-6"
        aria-hidden="true"
      />
      <h1 className="text-3xl font-bold tracking-tight mb-3">
        Page not found
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        We couldn&apos;t find the page you&apos;re looking for. It may have been
        moved, or the link might be incorrect.
      </p>
      <Button asChild>
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Back to support
        </Link>
      </Button>
    </main>
  );
}

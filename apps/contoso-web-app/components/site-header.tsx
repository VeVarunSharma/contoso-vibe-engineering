import Link from "next/link";
import { Button } from "@workspace/ui";
import { Code2 } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4 focus:underline"
      >
        Skip to main content
      </a>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link
            href="/"
            className="mr-6 flex min-h-11 items-center space-x-2 rounded-sm outline-offset-4 focus-visible:outline-2"
            aria-label="Contoso Vibe home"
          >
            <Code2 className="h-6 w-6" aria-hidden="true" />
            <span className="hidden font-bold sm:inline-block">
              Contoso Vibe
            </span>
          </Link>
          <nav
            className="flex items-center space-x-6 text-sm font-medium"
            aria-label="Main"
          >
            <Link
              href="#mission"
              className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground/80 text-foreground/60 outline-offset-4 focus-visible:outline-2"
            >
              Mission
            </Link>
            <Link
              href="#team"
              className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground/80 text-foreground/60 outline-offset-4 focus-visible:outline-2"
            >
              Team
            </Link>
            <Link
              href="/muppets"
              className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground/80 text-foreground/60 outline-offset-4 focus-visible:outline-2"
            >
              Muppets
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center" aria-label="Account">
            <Button variant="ghost" size="sm" className="min-w-11" asChild>
              <Link
                href="https://github.com/contoso-vibe"
                target="_blank"
                rel="noreferrer"
                aria-label="Open GitHub organization in a new tab"
              >
                GitHub
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

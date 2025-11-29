import Link from "next/link";
import { Button } from "@workspace/ui";
import { Code2 } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Code2 className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Contoso Vibe
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="#mission"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Mission
            </Link>
            <Link
              href="#team"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Team
            </Link>
            <Link
              href="/muppets"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Muppets
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link
                href="https://github.com/contoso-vibe"
                target="_blank"
                rel="noreferrer"
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

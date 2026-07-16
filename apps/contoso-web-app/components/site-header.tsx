import Link from "next/link";
import { Button } from "@workspace/ui";
import { Truck } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-16 items-center px-4 md:px-6">
        <div className="mr-4 flex items-center">
          <Link
            href="/"
            className="mr-6 flex min-h-11 items-center space-x-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Contoso Distribution home"
          >
            <Truck className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="hidden font-bold sm:inline-block">
              Contoso Distribution
            </span>
          </Link>
          <nav
            className="hidden items-center space-x-5 text-sm font-medium md:flex"
            aria-label="Main"
          >
            <Link
              href="#catalog"
              className="flex min-h-11 items-center rounded-md text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Catalog
            </Link>
            <Link
              href="#distribution"
              className="flex min-h-11 items-center rounded-md text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Distribution
            </Link>
            <Link
              href="#compliance"
              className="flex min-h-11 items-center rounded-md text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Compliance
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center" aria-label="Account">
            <Button className="min-h-11" asChild>
              <Link href="#catalog">Retailer catalog</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

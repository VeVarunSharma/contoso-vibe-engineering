"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui";
import { Menu, Truck, X } from "lucide-react";

export function SiteHeader() {
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex min-h-16 items-center px-4 md:px-6">
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
            id="main-navigation"
            className={`${menuIsOpen ? "flex" : "hidden"} absolute left-4 right-4 top-[calc(100%+0.5rem)] flex-col rounded-xl border bg-background p-3 text-sm font-medium shadow-lg md:static md:flex md:flex-row md:items-center md:space-x-5 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
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
          <Button
            type="button"
            className="min-h-11 min-w-11 md:hidden"
            variant="ghost"
            size="icon"
            aria-label={menuIsOpen ? "Close navigation" : "Open navigation"}
            aria-controls="main-navigation"
            aria-expanded={menuIsOpen}
            onClick={() => setMenuIsOpen((current) => !current)}
          >
            {menuIsOpen ? (
              <X aria-hidden="true" />
            ) : (
              <Menu aria-hidden="true" />
            )}
          </Button>
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

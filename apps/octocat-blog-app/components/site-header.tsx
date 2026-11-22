"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@workspace/ui/components/button";
import { Github, Moon, Sun, Menu } from "lucide-react";
import { useState } from "react";

const navLinkBase =
  "inline-flex min-h-11 items-center rounded-md px-1 text-sm font-medium transition-colors hover:text-primary outline-offset-4 focus-visible:outline-2";
const mobileLinkBase =
  "flex min-h-11 items-center rounded-md text-sm font-medium outline-offset-4 focus-visible:outline-2";

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-md outline-offset-4 focus-visible:outline-2"
        >
          <Github className="h-8 w-8" aria-hidden="true" />
          <span className="font-bold text-xl hidden sm:inline-block">
            Octocat Blog
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-6"
        >
          <Link href="/" className={navLinkBase}>
            Home
          </Link>
          <Link
            href="/category/releases"
            className={`${navLinkBase} text-muted-foreground`}
          >
            Releases
          </Link>
          <Link
            href="/category/features"
            className={`${navLinkBase} text-muted-foreground`}
          >
            Features
          </Link>
          <Link
            href="/category/changelog"
            className={`${navLinkBase} text-muted-foreground`}
          >
            Changelog
          </Link>
          <Link
            href="/category/engineering"
            className={`${navLinkBase} text-muted-foreground`}
          >
            Engineering
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle theme"
          >
            <Sun
              className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
              aria-hidden="true"
            />
            <Moon
              className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
              aria-hidden="true"
            />
          </Button>
          <Button variant="ghost" size="icon" className="size-11" asChild>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" aria-hidden="true" />
            </a>
          </Button>
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="size-11 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="md:hidden border-t px-4 py-4 space-y-2 bg-background"
        >
          <Link
            href="/"
            className={mobileLinkBase}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/category/releases"
            className={`${mobileLinkBase} text-muted-foreground`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Releases
          </Link>
          <Link
            href="/category/features"
            className={`${mobileLinkBase} text-muted-foreground`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/category/changelog"
            className={`${mobileLinkBase} text-muted-foreground`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Changelog
          </Link>
          <Link
            href="/category/engineering"
            className={`${mobileLinkBase} text-muted-foreground`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Engineering
          </Link>
        </nav>
      )}
    </header>
  );
}

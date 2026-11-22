"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@workspace/ui/components/button";
import { Github, Moon, Sun, Menu } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4 focus:underline"
      >
        Skip to main content
      </a>
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-sm outline-offset-4 focus-visible:outline-2"
          aria-label="Octocat Blog home"
        >
          <Github className="h-8 w-8" aria-hidden="true" />
          <span className="font-bold text-xl hidden sm:inline-block">
            Octocat Blog
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Primary navigation"
        >
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-medium transition-colors hover:text-primary outline-offset-4 focus-visible:outline-2"
          >
            Home
          </Link>
          <Link
            href="/category/releases"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary outline-offset-4 focus-visible:outline-2"
          >
            Releases
          </Link>
          <Link
            href="/category/features"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary outline-offset-4 focus-visible:outline-2"
          >
            Features
          </Link>
          <Link
            href="/category/changelog"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary outline-offset-4 focus-visible:outline-2"
          >
            Changelog
          </Link>
          <Link
            href="/category/engineering"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary outline-offset-4 focus-visible:outline-2"
          >
            Engineering
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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
          <Button variant="ghost" size="icon" asChild>
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
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          className="md:hidden border-t px-4 py-4 space-y-2 bg-background"
          aria-label="Mobile navigation"
        >
          <Link
            href="/"
            className="flex min-h-11 items-center py-2 text-sm font-medium outline-offset-4 focus-visible:outline-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/category/releases"
            className="flex min-h-11 items-center py-2 text-sm font-medium text-muted-foreground outline-offset-4 focus-visible:outline-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Releases
          </Link>
          <Link
            href="/category/features"
            className="flex min-h-11 items-center py-2 text-sm font-medium text-muted-foreground outline-offset-4 focus-visible:outline-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/category/changelog"
            className="flex min-h-11 items-center py-2 text-sm font-medium text-muted-foreground outline-offset-4 focus-visible:outline-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Changelog
          </Link>
          <Link
            href="/category/engineering"
            className="flex min-h-11 items-center py-2 text-sm font-medium text-muted-foreground outline-offset-4 focus-visible:outline-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Engineering
          </Link>
        </nav>
      )}
    </header>
  );
}

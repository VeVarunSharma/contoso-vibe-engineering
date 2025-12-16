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
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Github className="h-8 w-8" />
          <span className="font-bold text-xl hidden sm:inline-block">
            Octocat Blog
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link
            href="/category/releases"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Releases
          </Link>
          <Link
            href="/category/features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="/category/changelog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Changelog
          </Link>
          <Link
            href="/category/engineering"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t px-4 py-4 space-y-2 bg-background">
          <Link
            href="/"
            className="block py-2 text-sm font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/category/releases"
            className="block py-2 text-sm font-medium text-muted-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Releases
          </Link>
          <Link
            href="/category/features"
            className="block py-2 text-sm font-medium text-muted-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/category/changelog"
            className="block py-2 text-sm font-medium text-muted-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Changelog
          </Link>
          <Link
            href="/category/engineering"
            className="block py-2 text-sm font-medium text-muted-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Engineering
          </Link>
        </nav>
      )}
    </header>
  );
}

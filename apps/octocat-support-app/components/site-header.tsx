"use client";

import { Button } from "@workspace/ui/components/button";
import { Github, Headset, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-lg bg-primary p-1.5">
            <Headset className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:inline-block tracking-tight">
            Octocat Support
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Submit Ticket
          </Link>
          <a
            href="https://docs.github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Documentation
          </a>
          <a
            href="https://www.githubstatus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Status
          </a>
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
              href="https://github.com/VeVarunSharma/contoso-vibe-engineering"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
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
            Submit Ticket
          </Link>
          <a
            href="https://docs.github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 text-sm font-medium text-muted-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Documentation
          </a>
          <a
            href="https://www.githubstatus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 text-sm font-medium text-muted-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Status
          </a>
        </nav>
      )}
    </header>
  );
}

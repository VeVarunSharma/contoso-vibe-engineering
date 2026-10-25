"use client";

import { Button } from "@workspace/ui/components/button";
import { Github, Headset, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="border-b bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4 focus:underline"
      >
        Skip to report
      </a>
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 rounded-md font-semibold outline-offset-4 focus-visible:outline-2"
        >
          <Headset className="size-6" aria-hidden="true" />
          <span>Octocat Support</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle theme"
          >
            <Sun className="size-5 dark:hidden" aria-hidden="true" />
            <Moon className="hidden size-5 dark:block" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" className="size-11" asChild>
            <a
              href="https://github.com/VeVarunSharma/contoso-vibe-engineering"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Source repository"
            >
              <Github className="size-5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </nav>
    </header>
  );
}

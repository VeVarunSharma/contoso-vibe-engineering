import { Separator } from "@workspace/ui/components/separator";
import { Github, Headset } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Submit a Ticket
                </Link>
              </li>
              <li>
                <a
                  href="https://docs.github.com"
                  className="hover:text-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://community.github.com"
                  className="hover:text-primary transition-colors"
                >
                  Community
                </a>
              </li>
              <li>
                <a
                  href="https://www.githubstatus.com"
                  className="hover:text-primary transition-colors"
                >
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/features/actions"
                  className="hover:text-primary transition-colors"
                >
                  GitHub Actions
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/features/copilot"
                  className="hover:text-primary transition-colors"
                >
                  GitHub Copilot
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/features/codespaces"
                  className="hover:text-primary transition-colors"
                >
                  Codespaces
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/features/packages"
                  className="hover:text-primary transition-colors"
                >
                  Packages
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.blog"
                  className="hover:text-primary transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="https://resources.github.com"
                  className="hover:text-primary transition-colors"
                >
                  Resource Library
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/about"
                  className="hover:text-primary transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/VeVarunSharma/contoso-vibe-engineering"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/github"
                  className="hover:text-primary transition-colors"
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/github"
                  className="hover:text-primary transition-colors"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Headset className="h-4 w-4" />
            <span>Octocat Support</span>
          </div>
          <p>© {new Date().getFullYear()} GitHub, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

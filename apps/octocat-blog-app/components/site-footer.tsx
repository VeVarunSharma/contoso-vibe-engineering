import Link from "next/link";
import { Github, Twitter, Youtube, Rss } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/category/features" className="hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/category/releases" className="hover:text-primary">
                  Releases
                </Link>
              </li>
              <li>
                <Link href="/category/security" className="hover:text-primary">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/category/changelog" className="hover:text-primary">
                  Changelog
                </Link>
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
                  className="hover:text-primary"
                >
                  GitHub Actions
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/features/copilot"
                  className="hover:text-primary"
                >
                  GitHub Copilot
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/features/packages"
                  className="hover:text-primary"
                >
                  GitHub Packages
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/features/codespaces"
                  className="hover:text-primary"
                >
                  Codespaces
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://docs.github.com"
                  className="hover:text-primary"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://community.github.com"
                  className="hover:text-primary"
                >
                  Community
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/contact"
                  className="hover:text-primary"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="https://www.githubstatus.com"
                  className="hover:text-primary"
                >
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/about"
                  className="hover:text-primary"
                >
                  About
                </a>
              </li>
              <li>
                <a href="https://github.blog" className="hover:text-primary">
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/about/careers"
                  className="hover:text-primary"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/about/press"
                  className="hover:text-primary"
                >
                  Press
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Github className="h-6 w-6" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Octocat Blog. Built with Next.js.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com/github"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://youtube.com/github"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>
            <a
              href="/feed.xml"
              className="text-muted-foreground hover:text-primary"
              aria-label="RSS Feed"
            >
              <Rss className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

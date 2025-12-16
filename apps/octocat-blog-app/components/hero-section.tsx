import { Github, Rocket, Sparkles } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-muted/50 py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl" />

      <div className="container relative px-4 md:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>The official Octocat Blog</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            GitHub Updates,
            <br />
            <span className="text-primary">Straight from the Source</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
            Stay up to date with the latest releases, features, and changelog
            updates from GitHub. Your one-stop destination for all things
            Octocat.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="#latest-posts">
                <Rocket className="mr-2 h-5 w-5" />
                Explore Posts
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                Visit GitHub
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                100M+
              </div>
              <div className="text-sm text-muted-foreground">Developers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                330M+
              </div>
              <div className="text-sm text-muted-foreground">Repositories</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                4M+
              </div>
              <div className="text-sm text-muted-foreground">Organizations</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

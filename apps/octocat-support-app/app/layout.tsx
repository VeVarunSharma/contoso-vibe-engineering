import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "@workspace/ui/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Octocat Support — Engineering handoff",
    template: "%s | Octocat Support",
  },
  description:
    "Prepare and review a structured support report, then export a Markdown handoff. Optional GitHub publishing requires explicit confirmation.",
  keywords: [
    "GitHub",
    "support",
    "tickets",
    "issues",
    "help desk",
    "Copilot",
    "Octocat",
  ],
  authors: [{ name: "The Octocat", url: "https://github.com/octocat" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://octocat-support.example.com",
    title: "Octocat Support — Engineering handoff",
    description: "Turn a support report into a reviewable engineering handoff.",
    siteName: "Octocat Support",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Providers } from "@/components/providers";

import "@workspace/ui/globals.css";
import type { Metadata } from "next";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Octocat Blog - GitHub Updates & News",
    template: "%s | Octocat Blog",
  },
  description:
    "Stay up to date with the latest GitHub releases, features, and changelog updates. Your one-stop destination for all things Octocat.",
  keywords: [
    "GitHub",
    "releases",
    "changelog",
    "features",
    "updates",
    "Octocat",
    "developer",
    "open source",
  ],
  authors: [{ name: "The Octocat", url: "https://github.com/octocat" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://octocat-blog.example.com",
    title: "Octocat Blog - GitHub Updates & News",
    description:
      "Stay up to date with the latest GitHub releases, features, and changelog updates.",
    siteName: "Octocat Blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Octocat Blog - GitHub Updates & News",
    description:
      "Stay up to date with the latest GitHub releases, features, and changelog updates.",
    creator: "@github",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}

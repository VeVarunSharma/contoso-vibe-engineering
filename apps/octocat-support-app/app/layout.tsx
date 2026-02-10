import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Geist, Geist_Mono } from "next/font/google";

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
    default: "Octocat Support — Submit a Ticket",
    template: "%s | Octocat Support",
  },
  description:
    "Get help fast. Submit a support ticket and let AI-powered triage route your issue to the right team. Powered by GitHub Copilot SDK.",
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
    title: "Octocat Support — Submit a Ticket",
    description:
      "Get help fast. Submit a support ticket and let AI-powered triage route your issue to the right team.",
    siteName: "Octocat Support",
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

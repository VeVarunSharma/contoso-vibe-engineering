import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";

const fontSans = { variable: "--font-sans" };
const fontMono = { variable: "--font-mono" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}

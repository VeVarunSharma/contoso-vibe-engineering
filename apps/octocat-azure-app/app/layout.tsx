import type { Metadata } from "next";
import "@workspace/ui/globals.css";

export const metadata: Metadata = {
  title: "Octocat Azure App — SRE Agent Demo",
  description:
    "Demo app showcasing Azure SRE Agent best practices for App Service deployments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}

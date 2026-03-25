import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contoso Support Portal",
  description: "Submit and track support requests",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <main className="mx-auto max-w-4xl px-4 py-12">
          {children}
        </main>
      </body>
    </html>
  );
}

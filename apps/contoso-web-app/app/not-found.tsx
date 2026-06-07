import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          404
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist. It may have been
          moved or removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

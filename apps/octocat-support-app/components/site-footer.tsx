export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-4 py-6 text-xs leading-relaxed text-muted-foreground sm:px-6 lg:px-8">
        <p>Demonstration software. Not an official GitHub support channel.</p>
        <p>© {new Date().getFullYear()} GitHub, Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}

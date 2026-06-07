export default function Loading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
    </main>
  );
}

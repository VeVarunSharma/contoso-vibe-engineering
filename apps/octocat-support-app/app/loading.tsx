import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main
      className="flex items-center justify-center min-h-[60vh]"
      aria-busy="true"
      aria-label="Loading"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-muted-foreground"
        aria-hidden="true"
      />
    </main>
  );
}

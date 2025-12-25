import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";
import type { Tag } from "@/src/db/schema";

interface TagBadgeProps {
  tag: Tag;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      <TagIcon className="h-3 w-3" />
      {tag.name}
    </Link>
  );
}
